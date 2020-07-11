const express = require("express");
const Task = require("../models/task");
const auth = require('../middleware/auth');
const router = express.Router();

router.get("/tasks",auth, async (req, res) => {

  const match = {};
  const sort = {};

  if(req.query.done){
    match.done = req.query.done === 'true';
  }

  if(req.query.sortBy){
    const part = req.query.sortBy.split(':');
    sort[part[0]] = part[1]=== 'desc'? -1: 1;
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options:{
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id",auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findOne({_id, owner: req.user._id});
    await req.user.populate('tasks').execPopulate();
    if (!req.user.tasks) {
      return res.status(404).send();
    }
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/tasks", auth, async (req, res) => {
  console.log(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send();
  }
});

router.patch("/tasks/:id",auth, async (req, res) => {
  const allowed = ["done", "description"];
  const updates = Object.keys(req.body);
  const isValid = updates.every((update) => allowed.includes(update));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid parameters" });
  }
  try {
    const task = await Task.findOne({_id:req.params.id, owner: req.user._id});
    // const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => task[update]= req.body[update]);
    await task.save();
    
    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete("/tasks/:id",auth, async (req, res) => {
  try {
    // const task = await Task.findByIdAndDelete(req.params.id);
    const task = await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id});
    if (!task) {
      return res.status(404).send(task);
    }
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
