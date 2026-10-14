export default {
  "name": "ChatMessage",
  "policy": {
    "read": "participant",
    "create": "functionOnly",
    "update": "functionOnly",
    "delete": "sender"
  }
};
