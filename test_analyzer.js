const analyzer = require('./js/analyzer.js');

const files = [
  { path: 'package-lock.json', name: 'package-lock.json', content: '{}', size: 45000, ext: '.json', isDir: false },
  { path: 'src/server.js', name: 'server.js', content: 'const express = require("express");', size: 600, ext: '.js', isDir: false },
  { path: 'src/routes/auth.js', name: 'auth.js', content: 'const router = require("express").Router();', size: 280, ext: '.js', isDir: false },
  { path: 'src/models/Task.js', name: 'Task.js', content: 'const mongoose = require("mongoose");\nconst TaskSchema = new mongoose.Schema({ title: { type: String, required: true }, description: String, status: { type: String, enum: ["todo","in-progress","done"], default: "todo" }, assignee: mongoose.Types.ObjectId, project: mongoose.Types.ObjectId, dueDate: Date, priority: { type: String, enum: ["low","medium","high"], default: "medium" } }, { timestamps: true });\nmodule.exports = mongoose.model("Task", TaskSchema);', size: 520, ext: '.js', isDir: false },
  { path: 'src/models/User.js', name: 'User.js', content: 'const mongoose = require("mongoose");\nconst UserSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: String, role: { type: String, enum: ["user","admin"], default: "user" }, avatar: String }, { timestamps: true });\nmodule.exports = mongoose.model("User", UserSchema);', size: 420, ext: '.js', isDir: false },
  { path: 'src/models/Project.js', name: 'Project.js', content: 'const mongoose = require("mongoose");\nconst ProjectSchema = new mongoose.Schema({ name: String, description: String, owner: mongoose.Types.ObjectId, members: [mongoose.Types.ObjectId], status: String }, { timestamps: true });\nmodule.exports = mongoose.model("Project", ProjectSchema);', size: 360, ext: '.js', isDir: false },
  { path: 'package.json', name: 'package.json', content: '{}', size: 400, ext: '.json', isDir: false }
];

console.log('Running analysis...');
const t0 = Date.now();
const res = analyzer.analyzeProject(files);
console.log('Done in ' + (Date.now() - t0) + 'ms');
