import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";

export const addEmployee = async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (await Employee.findOne({ employeeId }))
      return res.status(400).json({ message: "Employee ID already exists" });

    if (await Employee.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeData = { ...req.body, password: hashedPassword };

    const employee = await Employee.create(employeeData);

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    res.status(201).json({ message: "Employee added successfully", employee: employeeResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getEmployeeById = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployeeByEmployeeId = async (req, res) => {
  try {
    const emp = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee updated successfully", employee: emp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
