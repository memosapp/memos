import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(401).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signUp = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/callback`,
      },
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: "Signed out successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// TODO: Implement phone authentication
/*
export const signInWithOtp = async (req: Request, res: Response) => {
  const { phone, email } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithOtp({ 
      phone: phone || undefined, 
      email: email || undefined 
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, email, token, type } = req.body;
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone || undefined,
      email: email || undefined,
      token,
      type: type || 'sms'
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
*/
