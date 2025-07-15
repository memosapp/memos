const capitalize = (str: string) => {
  if (!str) return "";
  if (str.length <= 1) return str.toUpperCase();
  return str.toUpperCase()[0] + str.slice(1);
};

function formatDate(timestamp: number) {
  // timestamp is already in milliseconds (from getTime())
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates (should not happen but good to be safe)
  if (diffInSeconds < 0) {
    return "Just now";
  }

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    // 7 days
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    // For older dates, show the actual date
    return date.toLocaleDateString();
  }
}

export { capitalize, formatDate };
