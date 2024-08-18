const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, restrictTo } = require('../middlewares/auth');
const {
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
} = require('../controllers/listController');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../postImages'));
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  },
});
const upload = multer({ storage: storage });
const router = express.Router();
router.patch(
  '/accept/:listId/:userId',
  auth,
  restrictTo('admin', 'supervisor', 'owner'),
  acceptDataList
);
router.get('/search', searchByCategory);
router.get('/searchName', searchByName);

router.get('/searchFalse', auth,restrictTo('admin', 'supervisor', 'owner'),searchByCategoryFalse);
router.get('/', getAllLists);
router.get('/userView', getAllListsUserView);
router.post(
  '/:userId',
  auth,
  upload.fields([
    { name: 'documents', maxCount: 10 },
    { name: 'selfImg', maxCount: 1 },
  ]),
  addNewList
);
router.delete('/:id/:userId', auth, restrictTo('admin', 'owner'), deleteList);
router.get('/:id', getSingleList);
router.patch(
  '/:id/:userId',
  auth,
  restrictTo('admin', 'supervisor', 'owner'),
  upload.single('image'),
  updateList
);
module.exports = router;
