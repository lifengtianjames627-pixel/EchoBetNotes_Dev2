export default {
  "name": "RecruitPosterAsset",
  "policy": {
    "read": "ownerOrAdmin",
    "create": "functionOnly",
    "update": "admin",
    "delete": "ownerOrAdmin"
  }
};
