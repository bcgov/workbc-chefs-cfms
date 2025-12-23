import * as express from "express"
import * as userController from "../controllers/user.controller"

const router = express.Router()

router.get("/", userController.getAllusers)
router.post("/", userController.createuser)
router.post("/getOne", userController.getOneuser)
router.put("/", userController.updateUser)

export default router
