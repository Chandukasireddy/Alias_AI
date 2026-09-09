import re
from typing import AsyncGenerator
from app.models import VaultSession


class StreamingRehydrator:
    """
    Sliding-Window Streaming Token Re-hydrator.
    Intercepts tokens from the cloud LLM, detects <ALIAS_...:N> boundaries,
    and replaces them with real secrets from the local in-memory vault.
    Handles partial alias tags split across streaming chunks.
    """

    def __init__(self, session: VaultSession):
        self.session = session
        self.buffer = ""
        self.alias_pattern = re.compile(r'<ALIAS_[A-Z_0-9]+>')

    async def rehydrate_stream(self, token_generator: AsyncGenerator[str, None]) -> AsyncGenerator[dict, None]:
        """
        Consumes cloud tokens, restores real values locally, and yields structured telemetry:
        {
            "cloud_chunk": "<ALIAS_USER_1>",
            "rehydrated_chunk": "Alexander Müller",
            "was_rehydrated": True,
            "alias_matched": "<ALIAS_USER_1>"
        }
        """
        async for chunk in token_generator:
            self.buffer += chunk

            # Check if there is an open '<' without a closing '>' (partial tag)
            if "<" in self.buffer and ">" not in self.buffer:
                # Wait for next chunk to complete the tag
                continue

            # Process completed tags in the buffer
            match = self.alias_pattern.search(self.buffer)
            if match:
                tag = match.group(0)
                real_value = self.session.get_real_value(tag)
                
                # Split buffer before the tag, replace tag, and output
                prefix = self.buffer[:match.start()]
                suffix = self.buffer[match.end():]

                if prefix:
                    yield {
                        "cloud_chunk": prefix,
                        "rehydrated_chunk": prefix,
                        "was_rehydrated": False,
                        "alias_matched": None
                    }

                replaced_val = real_value if real_value is not None else tag
                yield {
                    "cloud_chunk": tag,
                    "rehydrated_chunk": replaced_val,
                    "was_rehydrated": True,
                    "alias_matched": tag
                }

                self.buffer = suffix
            else:
                # If buffer doesn't contain partial tag, emit it
                if "<" not in self.buffer:
                    to_emit = self.buffer
                    self.buffer = ""
                    yield {
                        "cloud_chunk": to_emit,
                        "rehydrated_chunk": to_emit,
                        "was_rehydrated": False,
                        "alias_matched": None
                    }

        # Flush any remaining buffer at end of stream
        if self.buffer:
            match = self.alias_pattern.search(self.buffer)
            if match:
                tag = match.group(0)
                real_value = self.session.get_real_value(tag)
                self.buffer = self.buffer.replace(tag, real_value if real_value else tag)
            
            yield {
                "cloud_chunk": self.buffer,
                "rehydrated_chunk": self.buffer,
                "was_rehydrated": False,
                "alias_matched": None
            }
            self.buffer = ""

