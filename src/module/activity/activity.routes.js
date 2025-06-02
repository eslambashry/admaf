import { Hono } from "hono";
import { 
    createActivity, 
    getAllActivities, 
    getSingleActivity, 
    updateActivity, 
    deleteActivity,
    getActivitiesByCategory,
    searchActivities
} from "./activity.controller.js";
import { isAuth } from "../../middleware/isAuth.js";

const activityRouter = new Hono();

// Public routes
activityRouter.get('/getAll', getAllActivities);
activityRouter.get('/getSingle/:id', getSingleActivity);
activityRouter.get('/getByCategory/:categoryId', getActivitiesByCategory);
activityRouter.get('/search', searchActivities);
// Protected routes
activityRouter.use(isAuth);
activityRouter.post('/create', createActivity);
activityRouter.put('/update/:id', updateActivity);
activityRouter.delete('/delete/:id', deleteActivity);
export default activityRouter;

