function parsePayload(payload: any): { [key: string]: any } {
  if (!isObject(payload)) {
    throw new Error("Invalid payload");
  }

  const parsedPayload: { [key: string]: any } = {};

  for (const key in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      let parsedValue;

      if (
        typeof value === "string" &&
        value.startsWith("[") &&
        value.endsWith("]")
      ) {
        parsedValue = JSON.parse(value);
      } else if (
        typeof value === "string" &&
        value.startsWith("{") &&
        value.endsWith("}")
      ) {
        parsedValue = JSON.parse(value);
      } else {
        parsedValue = value;
      }

      parsedPayload[key] = parsedValue;
    }
  }

  return parsedPayload;
}

function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
export { parsePayload };
