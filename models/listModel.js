const mongoose = require('mongoose');
const listSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    name: { type: String },
    content: { type: String },
    governorate: { type: String },
    selfImg: { type: String },
    documents: [{ type: String }],
    notification: {
      type: String,
      default:
        'سيتم مراجعه منشورك وبعد ذلك سيتم قبوله من الادمن والمشرفين اذا وافق الشروط',
    }, //Yes or No
    externalLinks: {
      type: String,
    },
    isAccepted: { type: Boolean },
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

const listModel = mongoose.model('List', listSchema);
module.exports = listModel;
