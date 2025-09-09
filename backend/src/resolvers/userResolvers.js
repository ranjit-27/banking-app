import Joi from "joi";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const userResolvers = {
  Query: {
    users: async (_, __, { user }) => {
      if (!user) throw new Error("Authentication Required");
      try {
        return await User.find();
      } catch (err) {
        throw new Error("Error fetching users: " + err.message);
      }
    },
    user: async (_, { id }, { user }) => {
      if (!user) throw new Error("Authentication Required");
      try {
        const foundUser = await User.findById(id);
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      } catch (err) {
        throw new Error("Failed to fetch user: " + err.message);
      }
    },
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const { error } = userSchema.validate(input);
      if (error) throw new Error(error.details[0].message);

      try {
        const user = new User(input);
        return await user.save();
      } catch (err) {
        if (err.code === 11000) {
          throw new Error("Email address is already in use");
        }
        throw new Error("Failed to create user: " + err.message);
      }
    },

    updateUser: async (_, { id, input }, { user }) => {
      if (!user) throw new Error("Authentication required");
      if (user.userId !== id) throw new Error("Unauthorized: you can only update your own profile");

      try {
        const updatedUser = await User.findByIdAndUpdate(id, input, { new: true });
        if (!updatedUser) throw new Error("User not found for update");
        return updatedUser;
      } catch (err) {
        throw new Error("Failed to update user: " + err.message);
      }
    },

    deleteUser: async (_, { id }, { user }) => {
      if (!user) throw new Error("Authentication Required");
      if (user.userId !== id) throw new Error("Unauthorized: you can only delete your own profile");

      try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) throw new Error("User not found for deletion");
        return true;
      } catch (err) {
        throw new Error("Failed to delete user: " + err.message);
      }
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("Invalid credentials");

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error("Invalid credentials");

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return { token, user };
    },
  },
};
