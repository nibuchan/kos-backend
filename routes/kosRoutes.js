const express = require("express");
const router = express.Router();
const kosController = require("../controllers/kosController");
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/", kosController.getAllKos);
router.get("/:id", kosController.getKosById);

router.post("/", authenticate, upload.array("foto", 5), kosController.createKos);
router.put("/:id", authenticate, upload.array("foto", 5), kosController.updateKos);
router.delete("/:id", authenticate, kosController.deleteKos);

module.exports = router;
