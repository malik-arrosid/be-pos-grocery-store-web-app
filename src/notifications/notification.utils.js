export const formatNotificationCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value ?? "-";
  }

  return `Rp${amount.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const normalizeNotificationMetadata = (
  notificationType,
  metadata = null,
) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return metadata;
  }

  if (notificationType === "TRANSACTION_CREATED") {
    return {
      ...metadata,
      total_harga: formatNotificationCurrency(metadata.total_harga),
    };
  }

  return metadata;
};