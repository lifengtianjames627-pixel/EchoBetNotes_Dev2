export default {
  "name": "RecruitPost",
  "policy": {
    "read": "recruitVisible",
    "create": "owner",
    "update": "admin",
    "delete": "ownerOrAdmin"
  }
};
