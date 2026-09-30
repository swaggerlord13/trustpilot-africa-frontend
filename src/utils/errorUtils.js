/**
 * Extract the most useful error message from an axios error.
 * Checks err.response.data.error, then .message, then err.message.
 * Falls back to the provided default string if nothing is found.
 */
export function getErrorMessage(err, fallback = "Something went wrong") {
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    fallback
  );
}
