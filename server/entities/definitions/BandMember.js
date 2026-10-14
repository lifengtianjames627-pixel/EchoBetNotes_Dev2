export default {
  "name": "BandMember",
  "policy": {
    "read": "public",
    "create": "authenticated",
    "update": "ownerOrAdmin",
    "delete": "ownerOrAdmin"
  }
};
