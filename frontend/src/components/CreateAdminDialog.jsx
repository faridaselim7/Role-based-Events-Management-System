import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { createAdmin } from "../services/adminApi";

export default function CreateAdminDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Admin",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { firstName, lastName, email, password, role } = form;
    if (!firstName || !lastName || !email || !password || !role) {
      setError("All fields are required.");
      return;
    }
    if (!["Admin", "Event Office"].includes(role)) {
      setError("Role must be Admin or Event Office.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await createAdmin({ firstName, lastName, email, password, role });
      if (onCreated) onCreated(res?.admin);
      // reset and close
      setForm({ firstName: "", lastName: "", email: "", password: "", role: "Admin" });
      onOpenChange(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to create admin";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Create Admin</DialogTitle>
          <DialogDescription>
            Create a new Admin or Event Office account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error ? (
            <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded p-2">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Jane"
                value={form.firstName}
                onChange={onChange}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Doe"
                value={form.lastName}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="border rounded-md px-3 py-2 text-sm"
              placeholder="name@example.com"
              value={form.email}
              onChange={onChange}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="border rounded-md px-3 py-2 text-sm"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium" htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              className="border rounded-md px-3 py-2 text-sm"
              value={form.role}
              onChange={onChange}
            >
              <option value="Admin">Admin</option>
              <option value="Event Office">Event Office</option>
            </select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-md border text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-green-600 text-white text-sm disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
