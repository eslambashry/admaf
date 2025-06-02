import { ActivityModel } from "../../../DB/models/activity.js";
import catchError from "../../middleware/ErrorHandeling.js";
import CustomError from "../../utilities/customError.js";

// Create Activity
export const createActivity = catchError(async(c) => {
    const {
        title,
        sub_title,
        description,
        location,
        date,
        time,
        content,
        images,
        categry
    } = await c.req.json();

    // Validation
    if (!title?.en || !title?.ar) {
        throw new CustomError('Title in both English and Arabic is required', 400);
    }
    if (!categry) {
        throw new CustomError('Category is required', 400);
    }

    const activity = new ActivityModel({
        title,
        sub_title,
        description,
        location,
        date,
        time,
        content,
        images,
        categry
    });

    const activityData = await activity.save();
    return c.json({message: 'Activity created successfully', activityData}, 201);
});

// Get All Activities
export const getAllActivities = catchError(async(c) => {
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const skip = (page - 1) * limit;

    const activities = await ActivityModel.find()
        .populate('categry')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const totalActivities = await ActivityModel.countDocuments();
    const totalPages = Math.ceil(totalActivities / limit);

    return c.json({
        message: 'Activities retrieved successfully',
        activities,
        pagination: {
            currentPage: page,
            totalPages,
            totalActivities,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    }, 200);
});

// Get Single Activity
export const getSingleActivity = catchError(async(c) => {
    const { id } = c.req.param();

    if (!id) {
        throw new CustomError('Activity ID is required', 400);
    }

    const activity = await ActivityModel.findById(id).populate('categry');
    
    if (!activity) {
        throw new CustomError('Activity not found', 404);
    }

    return c.json({
        message: 'Activity retrieved successfully',
        activity
    }, 200);
});

// Update Activity
export const updateActivity = catchError(async(c) => {
    const { id } = c.req.param();
    const updateData = await c.req.json();

    if (!id) {
        throw new CustomError('Activity ID is required', 400);
    }

    const activity = await ActivityModel.findById(id);
    
    if (!activity) {
        throw new CustomError('Activity not found', 404);
    }

    const updatedActivity = await ActivityModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('categry');

    return c.json({
        message: 'Activity updated successfully',
        activity: updatedActivity
    }, 200);
});

// Delete Activity
export const deleteActivity = catchError(async(c) => {
    const { id } = c.req.param();

    if (!id) {
        throw new CustomError('Activity ID is required', 400);
    }

    const activity = await ActivityModel.findById(id);
    
    if (!activity) {
        throw new CustomError('Activity not found', 404);
    }

    await ActivityModel.findByIdAndDelete(id);

    return c.json({
        message: 'Activity deleted successfully'
    }, 200);
});

// Get Activities by Category
export const getActivitiesByCategory = catchError(async(c) => {
    const { categoryId } = c.req.param();
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const skip = (page - 1) * limit;

    if (!categoryId) {
        throw new CustomError('Category ID is required', 400);
    }

    const activities = await ActivityModel.find({ categry: categoryId })
        .populate('categry')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const totalActivities = await ActivityModel.countDocuments({ categry: categoryId });
    const totalPages = Math.ceil(totalActivities / limit);

    return c.json({
        message: 'Activities by category retrieved successfully',
        activities,
        pagination: {
            currentPage: page,
            totalPages,
            totalActivities,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    }, 200);
});

// Search Activities
export const searchActivities = catchError(async(c) => {
    const { q } = c.req.query();
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
        throw new CustomError('Search query is required', 400);
    }

    const searchRegex = new RegExp(q, 'i');
    
    const activities = await ActivityModel.find({
        $or: [
            { 'title.en': searchRegex },
            { 'title.ar': searchRegex },
            { 'description.en': searchRegex },
            { 'description.ar': searchRegex },
            { 'content.en': searchRegex },
            { 'content.ar': searchRegex }
        ]
    })
    .populate('categry')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    const totalActivities = await ActivityModel.countDocuments({
        $or: [
            { 'title.en': searchRegex },
            { 'title.ar': searchRegex },
            { 'description.en': searchRegex },
            { 'description.ar': searchRegex },
            { 'content.en': searchRegex },
            { 'content.ar': searchRegex }
        ]
    });

    const totalPages = Math.ceil(totalActivities / limit);

    return c.json({
        message: 'Search results retrieved successfully',
        activities,
        searchQuery: q,
        pagination: {
            currentPage: page,
            totalPages,
            totalActivities,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    }, 200);
});
