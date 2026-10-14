export default {
  "name": "Subscription",
  "policy": {
    "read": "subscriberOrAdmin",
    "create": "subscriber",
    "update": "admin",
    "delete": "subscriberOrAdmin"
  }
};
