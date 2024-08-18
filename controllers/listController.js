const listModel = require('../models/listModel');
const userModel = require('../models/userModel');
const sgelModel = require('../models/seglModel');
const notificationModel = require('../models/notificationModel');

const mongoose = require('mongoose');

const getAllLists = async (req, res) => {
  try {
      const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;
    let lists = await listModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }).populate('user');
    res.status(201).json({
      message: 'Successfully fetched all the lists',
      data: lists,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getAllListsUserView = async (req, res) => {
  try {
      const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;
    let lists = await listModel
      .find({ isAccepted: true }).skip(skip).limit(limit)
      .sort({ createdAt: -1 }).populate('user');
    res.status(201).json({
      message: 'Successfully fetched all the lists',
      data: lists,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deleteList = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const data = await listModel.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json('Id Not Found');
    }
    const user = await userModel.findById(userId);
        if (user.role !== 'owner') {
      const sgelData = await sgelModel.create({
        type: `delete list data post`,
        user: user,
        data: data,
      });
    }
    res.status(200).json('list Deleted Successfully');
  } catch (error) {
    return res.status(500).json(error.message);
  }
};
const getSingleList = async (req, res) => {
  try {
    const { id } = req.params;
    const singleMassacres = await listModel.findById(id).populate('user');
    res.json(singleMassacres);
  } catch (error) {
    res.status(400).json({ error: 'Error in Fetching Data' });
  }
};
const searchByCategory = async (req, res) => {
  try {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;
    const { category } = req.query;
    const found = await listModel
      .find({
        category: category,
        isAccepted: true,
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }).populate('user');
    res.json(found);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchByName = async (req, res) => {
  try {
    const { name } = req.query;
    const found = await listModel
      .find({ name: { $regex: name, $options: 'i' }, isAccepted: true })
      .sort({ createdAt: -1 }).populate('user');
    res.json(found);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const searchByCategoryFalse = async (req, res) => {
  try {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 5;
    const skip = (page - 1) * limit;
    const { category } = req.query;
    const found = await listModel
      .find({
        category: category,
        isAccepted: false,
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }).populate('user');
    res.json(found);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateList = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { name, content, governorate, externalLinks } = req.body;
    let selfImg = '';
    if (req.file !== undefined) {
      selfImg = req.file.filename;
    } else {
      const existingUser = await listModel.findById(id);
      if (existingUser) {
        selfImg = existingUser.selfImg;
      }
    }

    const updateList = await listModel.findByIdAndUpdate(
      id,
      {
        selfImg,
        content,
        governorate,
        name,
        externalLinks,
      },
      { new: true }
    );

    if (!updateList) {
      res.status(404).json('No list with this Id found.');
    }
    const user = await userModel.findById(userId);
       if (user.role !== 'owner') {
      const sgelData = await sgelModel.create({
        type: `updata list data post`,
        user: user,
        data: updateList,
      });
    }
    res.status(200).json({ data: updateList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const addNewList = async (req, res) => {
  try {
    const { userId } = req.params;
    let files = req.files;
    let documents = [];
    if (files['documents'] != undefined) {
      documents = files['documents'].map((file) => file.filename);
    }
    const selfImg = files['selfImg'][0].filename;

    const { externalLinks, content, governorate, name, category, isAccepted } =
      req.body;
    const user = await userModel.findById(userId);
    const addNewList = await listModel.create({
      externalLinks,
      content,
      governorate,
      name,
      category,
      isAccepted:
        user.role === 'admin' ||
        user.role === 'supervisor' ||
        user.role === 'owner',
      selfImg,
      documents,
      user: userId,
    });
  
    if (!addNewList) {
      return res.status(400).json({ error: 'Failed to add the list' });
    }
    const updateData = await userModel
      .findByIdAndUpdate(
        userId,
        { lists: [...user.lists, addNewList] },
        { new: true }
      )
      .populate('lists');
     if (user.role !== 'owner') {

        if (user.role !== 'owner') {
      const sgelData = await sgelModel.create({
        type: `add list data post`,
        user: user,
        data: addNewList,
      });
    }
    if (addNewList.isAccepted == true) {
      const notificationData = await notificationModel.create({
        type: `add list data post`,
        user: user,
        data: addNewList,
      });
    }
    res.status(200).json(updateData);
  }
      
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptDataList = async (req, res) => {
  try {
    const { listId, userId } = req.params;

    const acceptedList = await listModel.findByIdAndUpdate(
      listId,
      {
        isAccepted: true,
        notification: 'تم قبول منشورك بنجاح',
      },
      { new: true }
    );

    if (!acceptedList) {
      return res.status(400).json({ error: 'Failed to update the data' });
    }
    const user = await userModel.findById(userId);
       if (user.role !== 'owner') {
      const sgelData = await sgelModel.create({
        type: `accept list data post`,
        user: user,
        data: acceptedList,
      });
    }
    const notificationData = await notificationModel.create({
      type: `add list data post`,
      user: user,
      data: acceptedList,
    });
    res
      .status(200)
      .json({ success: 'data updated successfully', data: acceptedList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllLists,
  deleteList,
  getSingleList,
  searchByCategory,
  updateList,
  addNewList,
  acceptDataList,
  getAllListsUserView,
  searchByCategoryFalse,
  searchByName
};
