export default {
  "name": "ReviewVote",
  "policy": {
    "read": "voterOrAdmin",
    "create": "functionOnly",
    "update": "functionOnly",
    "delete": "functionOnly"
  }
};
