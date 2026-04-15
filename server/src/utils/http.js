export const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const isValidSlug = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isValidColorHex = (value) => /^#[0-9a-fA-F]{6}$/.test(value);

export const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
