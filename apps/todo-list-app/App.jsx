import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pin,
  Calendar,
  FileText,
  Trash2,
  Share2,
  Bell,
  BellOff,
  X,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import './index.css';
import { auth, db } from "./components/firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { gapi } from "gapi-script";

const GOOGLE_CALENDAR_DISCOVERY =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

const googleClientId = import.meta.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const googleApiKey = import.meta.env.REACT_APP_GOOGLE_API_KEY || "";
const googleCalendarEnvEnabled =
  import.meta.env.REACT_APP_ENABLE_GOOGLE_CALENDAR === "true";
const canUseGoogleCalendar =
  googleCalendarEnvEnabled && Boolean(googleClientId && googleApiKey);

const ABCDTodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");

  const getLastPasswordLoginKey = (uid) => `last-password-login-${uid}`;

  const markPasswordLoginAt = (uid) => {
    localStorage.setItem(getLastPasswordLoginKey(uid), String(Date.now()));
  };

  const userTasksCollectionRef = (uid) =>
    collection(db, "users", uid, "tasks");

  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        authEmail.trim(),
        authPassword
      );
      markPasswordLoginAt(cred.user.uid);
      // auth state listener will switch UI to the todo app
    } catch (err) {
      const code = err?.code;
      if (code === "auth/user-not-found") {
        setAuthMode("signup");
        setAuthError("No account found. Enter your details to create one.");
      } else if (code === "auth/wrong-password") {
        setAuthError("Wrong password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError("Sign in failed. Please check your details.");
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignUp = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      if (!authDisplayName.trim()) {
        setAuthError("Please enter your name to create your account.");
        return;
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        authEmail.trim(),
        authPassword
      );

      // Create the corresponding user document in Firestore
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          email: cred.user.email,
          displayName: authDisplayName.trim(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      markPasswordLoginAt(cred.user.uid);
      setAuthMode("login");
    } catch (err) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setAuthMode("login");
        setAuthError("This email already exists. Please sign in.");
      } else if (code === "auth/weak-password") {
        setAuthError("Password is too weak. Use at least 6 characters.");
      } else {
        setAuthError("Sign up failed. Please try again.");
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    setAuthError("");
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Logout failed", e);
    }
  };

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "A",
    notes: "",
    dueDate: "",
    pinned: false,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [backupCode, setBackupCode] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    daysBefore: 1,
    syncToGoogleCalendar: false,
  });
  const [gapiReady, setGapiReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [calendarBusyId, setCalendarBusyId] = useState(null);

  useEffect(() => {
    if (!canUseGoogleCalendar) return;

    const initClient = () => {
      gapi.client
        .init({
          apiKey: googleApiKey,
          clientId: googleClientId,
          discoveryDocs: [GOOGLE_CALENDAR_DISCOVERY],
          scope: GOOGLE_CALENDAR_SCOPE,
        })
        .then(() => setGapiReady(Boolean(gapi.client?.calendar)))
        .catch((err) => console.error("gapi init error:", err));
    };

    gapi.load("client:auth2", initClient);
  }, []);

  // Firebase Auth gate + forced re-login after a time interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setAuthLoading(false);
        setAuthError("");
        setAuthMode("login");
        setTasks([]);
        return;
      }

      const lastRaw = localStorage.getItem(`last-password-login-${user.uid}`);
      const lastAt = lastRaw ? Number(lastRaw) : 0;
      const expired = !lastAt || Date.now() - lastAt > 30 * 60 * 1000;

      if (expired) {
        setAuthEmail(user.email || "");
        setAuthError("Session expired. Please sign in again.");
        setAuthMode("login");
        setFirebaseUser(null);
        setTasks([]);
        setAuthLoading(false);
        try {
          await signOut(auth);
        } catch (e) {
          console.warn("signOut failed after session expiry", e);
        }
        return;
      }

      setFirebaseUser(user);
      setAuthEmail(user.email || "");
      setAuthError("");
      setAuthMode("login");
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const savedSettings = localStorage.getItem(
      `notification-settings-${firebaseUser.uid}`
    );
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings({
          daysBefore: 1,
          syncToGoogleCalendar: false,
          ...parsed,
        });
      } catch (e) {
        console.error("Failed to load settings");
      }
    }

    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    setFirestoreError(null);

    const tasksRef = userTasksCollectionRef(firebaseUser.uid);
    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        setTasks(snapshot.docs.map((d) => d.data()));
        setFirestoreError(null);
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Failed to load tasks", error);
        setFirestoreError(
          "Could not connect to Firestore. Check Firebase rules and network."
        );
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // Save notification settings
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    localStorage.setItem(
      `notification-settings-${firebaseUser.uid}`,
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings, firebaseUser]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");

      if (permission === "granted") {
        new Notification("Notifications Enabled! 🔔", {
          body: "You'll now receive reminders for your tasks",
          icon: "✅",
        });
      } else {
        alert(
          "Please enable notifications in your browser settings to receive task reminders"
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  const sendNotification = useCallback(
    (title, body, priority) => {
      if (!notificationsEnabled || Notification.permission !== "granted") return;

      const priorityEmojis = {
        A: "🔴",
        B: "🟠",
        C: "🟡",
        D: "🟢",
      };

      new Notification(`${priorityEmojis[priority]} ${title}`, {
        body: body,
        icon: "📋",
        tag: `task-${Date.now()}`,
        requireInteraction: priority === "A",
      });
    },
    [notificationsEnabled]
  );
  const ensureGoogleSignedIn = async () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
  };

  const addToCalendar = async (task) => {
    if (!canUseGoogleCalendar) {
      throw new Error("Google Calendar is not configured");
    }
    if (!gapi.client?.calendar) {
      throw new Error("Google Calendar API is still loading");
    }

    await ensureGoogleSignedIn();

    // build event resource
    // if dueDate is YYYY-MM-DD (type=date) => create ALL-DAY event using start.date / end.date (end is next day)
    // if you used datetime-local (YYYY-MM-DDTHH:mm) you can set dateTime fields instead.
    let event;
    if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
      const startDate = task.dueDate;
      // compute next day ISO date for end.date (Calendar all-day end is exclusive)
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const yyyy = nextDay.getFullYear();
      const mm = String(nextDay.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDay.getDate()).padStart(2, "0");
      const endDate = `${yyyy}-${mm}-${dd}`;

      event = {
        summary: task.title,
        description: task.notes || "",
        start: { date: startDate }, // all-day start
        end: { date: endDate }, // all-day end (exclusive)
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 10 },
            { method: "email", minutes: 24 * 60 }, // optional
          ],
        },
      };
    } else {
      // assume datetime string
      const dt = new Date(task.dueDate);
      const end = new Date(dt.getTime() + 60 * 60 * 1000); // 1-hour event
      event = {
        summary: task.title,
        description: task.notes || "",
        start: {
          dateTime: dt.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 10 }],
        },
      };
    }

    try {
      const res = await gapi.client.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });
      return res.result;
    } catch (err) {
      console.error("Calendar insert failed:", err);
      throw err;
    }
  };

  const removeFromCalendar = async (calendarEventId) => {
    if (!calendarEventId || !canUseGoogleCalendar || !gapi.client?.calendar) {
      return;
    }
    try {
      await ensureGoogleSignedIn();
      await gapi.client.calendar.events.delete({
        calendarId: "primary",
        eventId: calendarEventId,
      });
    } catch (err) {
      console.warn("Could not remove calendar event:", err);
    }
  };

  const handleAddToCalendar = async (task) => {
    if (!task.dueDate) {
      alert("Add a due date before syncing to Google Calendar.");
      return;
    }
    setCalendarBusyId(task.id);
    try {
      const calendarRes = await addToCalendar(task);
      if (calendarRes?.id) {
        await updateDoc(doc(db, "users", firebaseUser.uid, "tasks", String(task.id)), {
          calendarEventId: calendarRes.id,
        });
        alert("Added to Google Calendar.");
      }
    } catch (err) {
      console.warn("Calendar sync failed:", err);
      alert(
        "Could not add to Google Calendar. Sign in when prompted, or check API credentials in .env."
      );
    } finally {
      setCalendarBusyId(null);
    }
  };

  const checkDueTasks = useCallback(() => {
    const now = new Date();
    const uid = firebaseUser?.uid;
    if (!uid) return;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    tasks.forEach((task) => {
      if (!task.dueDate || task.completed) return;

      const dueDate = new Date(task.dueDate);
      const dueDateOnly = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      );
      const diffDays = Math.ceil((dueDateOnly - today) / (1000 * 60 * 60 * 24));

      // Get last notification time for this task
      const lastNotified = localStorage.getItem(`notified-${uid}-${task.id}`);
      const lastNotifiedDate = lastNotified ? new Date(lastNotified) : null;
      const hoursSinceLastNotification = lastNotifiedDate
        ? (now - lastNotifiedDate) / (1000 * 60 * 60)
        : 999;

      // Only notify once per day per task
      if (hoursSinceLastNotification < 23) return;

      // Task is overdue
      if (diffDays < 0 && !task.completed) {
        sendNotification(
          task.title,
          `OVERDUE by ${Math.abs(diffDays)} day(s)! Priority ${task.priority}`,
          task.priority
        );
        localStorage.setItem(`notified-${uid}-${task.id}`, now.toISOString());
      }
      // Task is due today
      else if (diffDays === 0) {
        sendNotification(
          task.title,
          `Due TODAY! Priority ${task.priority}`,
          task.priority
        );
        localStorage.setItem(`notified-${uid}-${task.id}`, now.toISOString());
      }
      // Task is due soon (based on settings)
      else if (diffDays > 0 && diffDays <= notificationSettings.daysBefore) {
        sendNotification(
          task.title,
          `Due in ${diffDays} day(s). Priority ${task.priority}`,
          task.priority
        );
        localStorage.setItem(`notified-${uid}-${task.id}`, now.toISOString());
      }
    });
  }, [
    tasks,
    notificationSettings,
    sendNotification,
    firebaseUser,
  ]);

  useEffect(() => {
    if (!notificationsEnabled || tasks.length === 0) return;

    const checkInterval = setInterval(checkDueTasks, 60000);
    checkDueTasks();

    return () => clearInterval(checkInterval);
  }, [tasks, notificationsEnabled, checkDueTasks]);

  const priorityColors = {
    A: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-700",
      badge: "bg-red-500",
    },
    B: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-700",
      badge: "bg-orange-500",
    },
    C: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-700",
      badge: "bg-yellow-500",
    },
    D: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      badge: "bg-green-500",
    },
  };

  const priorityLabels = {
    A: "Urgent & Important",
    B: "Important",
    C: "Nice to Do",
    D: "Delegate/Low Priority",
  };
  const addTask = async () => {
    if (!newTask.title.trim()) return;

    const task = {
      id: Date.now(),
      ...newTask,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", firebaseUser.uid, "tasks", String(task.id)), task);

    if (
      task.dueDate &&
      canUseGoogleCalendar &&
      notificationSettings.syncToGoogleCalendar
    ) {
      try {
        const calendarRes = await addToCalendar(task);
        if (calendarRes?.id) {
          await updateDoc(
            doc(db, "users", firebaseUser.uid, "tasks", String(task.id)),
            {
            calendarEventId: calendarRes.id,
            }
          );
        }
      } catch (err) {
        console.warn("Auto calendar sync skipped:", err);
      }
    }

    setNewTask({
      title: "",
      priority: "A",
      notes: "",
      dueDate: "",
      pinned: false,
    });
    setShowAddForm(false);

    if (task.dueDate && notificationsEnabled) {
      const dueDate = new Date(task.dueDate);
      sendNotification(
        "Task Added!",
        `"${task.title}" due on ${dueDate.toLocaleDateString()}`,
        task.priority
      );
    }
  };

  const deleteTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    try {
      if (task?.calendarEventId) {
        await removeFromCalendar(task.calendarEventId);
      }
      await deleteDoc(doc(db, "users", firebaseUser.uid, "tasks", String(id)));
      if (firebaseUser?.uid) {
        localStorage.removeItem(`notified-${firebaseUser.uid}-${id}`);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Check your connection.");
    }
  };

  const toggleComplete = async (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );

    const task = tasks.find((t) => t.id === id);
    if (task) {
      try {
        const updatedTask = { ...task, completed: !task.completed };
        await updateDoc(
          doc(db, "users", firebaseUser.uid, "tasks", String(task.id)),
          updatedTask
        );

        if (!task.completed && notificationsEnabled) {
          sendNotification("Task Completed! 🎉", task.title, task.priority);
        }
      } catch (error) {
        console.error("Failed to update task in Firestore:", error);
      }
    }
  };

  const togglePin = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const pinned = !task.pinned;
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid, "tasks", String(id)), { pinned });
    } catch (error) {
      console.error("Failed to update pin:", error);
      alert("Failed to save pin state.");
    }
  };

  const generateSyncCode = () => {
    const code = btoa(JSON.stringify(tasks));
    setBackupCode(code);
    setRestoreCode("");
    setShowSyncModal(true);
  };

  const loadSyncCode = async () => {
    if (!restoreCode.trim()) return;

    try {
      const decoded = JSON.parse(atob(restoreCode));
      if (!Array.isArray(decoded)) {
        throw new Error("Backup must be a task array");
      }

      await Promise.all(
        decoded.map((task) =>
          setDoc(doc(db, "users", firebaseUser.uid, "tasks", String(task.id)), task)
        )
      );

      alert("Tasks restored to cloud storage.");
      setShowSyncModal(false);
      setRestoreCode("");
    } catch (e) {
      alert("Invalid backup code. Please check and try again.");
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filter !== "all") {
      filtered = filtered.filter((t) => t.priority === filter);
    }

    return filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      if (a.priority !== b.priority)
        return a.priority.localeCompare(b.priority);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const getTaskStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      overdue: tasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
      ).length,
      dueToday: tasks.filter((t) => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        const dueDateOnly = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );
        return dueDateOnly.getTime() === today.getTime();
      }).length,
      A: tasks.filter((t) => t.priority === "A").length,
      B: tasks.filter((t) => t.priority === "B").length,
      C: tasks.filter((t) => t.priority === "C").length,
      D: tasks.filter((t) => t.priority === "D").length,
    };
  };

  const stats = getTaskStats();
  const filteredTasks = getFilteredTasks();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-gray-700 font-medium">Loading session…</span>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              ABCD Priority Planner
            </h1>
            <p className="text-gray-600 mb-6">
              Sign in to view your isolated todos.
            </p>

            {authError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg text-red-800">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your password"
                  autoComplete={
                    authMode === "signup" ? "new-password" : "current-password"
                  }
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={authDisplayName}
                    onChange={(e) => setAuthDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Selva"
                    autoComplete="name"
                  />
                </div>
              )}

              <button
                onClick={authMode === "login" ? handleSignIn : handleSignUp}
                disabled={authBusy || !authEmail.trim() || !authPassword}
                className={`w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50`}
              >
                {authBusy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Please wait…
                  </>
                ) : authMode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>

              <button
                onClick={() => {
                  setAuthError("");
                  setAuthMode(authMode === "login" ? "signup" : "login");
                }}
                className="w-full text-sm text-indigo-700 hover:text-indigo-900 transition"
              >
                {authMode === "login"
                  ? "No account? Create one"
                  : "Already have an account? Sign in"}
              </button>

              <p className="text-xs text-gray-500 pt-2">
                For your security, you’ll be asked to sign in again after{" "}
                30 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ABCD Priority Planner
              </h1>
              <p className="text-gray-600">
                ABCD priority tasks · Firestore sync · browser reminders
                {canUseGoogleCalendar && gapiReady
                  ? " · Google Calendar available"
                  : ""}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={20} />
                Add Task
              </button>
              <button
                onClick={
                  notificationsEnabled
                    ? () => setShowNotificationSettings(true)
                    : requestNotificationPermission
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  notificationsEnabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                {notificationsEnabled ? (
                  <Bell size={20} />
                ) : (
                  <BellOff size={20} />
                )}
                {notificationsEnabled
                  ? "Notifications On"
                  : "Enable Notifications"}
              </button>
              <button
                onClick={generateSyncCode}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                <Share2 size={20} />
                Backup
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                <X size={20} />
                Log out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-xs text-green-600">Done</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <div className="text-xs text-red-600">Overdue</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.dueToday}
              </div>
              <div className="text-xs text-blue-600">Due Today</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.A}</div>
              <div className="text-xs text-red-600">Priority A</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.B}
              </div>
              <div className="text-xs text-orange-600">Priority B</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.C}
              </div>
              <div className="text-xs text-yellow-600">Priority C</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.D}</div>
              <div className="text-xs text-green-600">Priority D</div>
            </div>
          </div>
        </div>

        {firestoreError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg text-red-800">
            {firestoreError}
          </div>
        )}

        {loadingTasks && (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
            <Loader2 className="animate-spin" size={24} />
            Loading tasks…
          </div>
        )}

        {/* Notification Banner */}
        {!notificationsEnabled && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-yellow-600" size={24} />
                <div>
                  <p className="text-yellow-800 font-medium">
                    Enable notifications to get reminders!
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Never miss a deadline - get notified about upcoming and
                    overdue tasks
                  </p>
                </div>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition whitespace-nowrap"
              >
                Enable Now
              </button>
            </div>
          </div>
        )}

        {/* Add Task Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Add New Task
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title *"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="A">A - Urgent & Important</option>
                    <option value="B">B - Important</option>
                    <option value="C">C - Nice to Do</option>
                    <option value="D">D - Delegate/Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date{" "}
                    {notificationsEnabled && "(📬 Notifications enabled)"}
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Add any notes or details..."
                  value={newTask.notes}
                  onChange={(e) =>
                    setNewTask({ ...newTask, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinTask"
                  checked={newTask.pinned}
                  onChange={(e) =>
                    setNewTask({ ...newTask, pinned: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="pinTask" className="text-sm text-gray-700">
                  Pin this task to top
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium transition"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["all", "A", "B", "C", "D"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "All Tasks" : `Priority ${f}`}
            </button>
          ))}
        </div>

        {/* Tasks Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const colors = priorityColors[task.priority];
            const isOverdue =
              task.dueDate &&
              !task.completed &&
              new Date(task.dueDate) < new Date();
            const isDueToday =
              task.dueDate &&
              !task.completed &&
              (() => {
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                return today.toDateString() === dueDate.toDateString();
              })();

            return (
              <div
                key={task.id}
                className={`${colors.bg} border-2 ${
                  colors.border
                } rounded-xl p-4 shadow-lg transition hover:shadow-xl ${
                  task.completed ? "opacity-60" : ""
                } ${isOverdue ? "ring-2 ring-red-500" : ""} ${
                  isDueToday ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`${colors.badge} text-white text-xs font-bold px-2 py-1 rounded`}
                    >
                      {task.priority}
                    </span>
                    {task.pinned && (
                      <Pin size={16} className="text-gray-600 fill-current" />
                    )}
                    {isOverdue && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        OVERDUE
                      </span>
                    )}
                    {isDueToday && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePin(task.id)}
                      className="p-1 hover:bg-white rounded transition"
                    >
                      <Pin
                        size={16}
                        className={task.pinned ? "fill-current" : ""}
                      />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 hover:bg-white rounded transition text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-start gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
                  />
                  <h3
                    className={`text-lg font-semibold ${colors.text} ${
                      task.completed ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                </div>

                {/* Priority Label */}
                <div className={`text-xs ${colors.text} font-medium mb-3`}>
                  {priorityLabels[task.priority]}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div
                    className={`flex items-center gap-2 text-sm mb-2 ${
                      isOverdue
                        ? "text-red-600 font-bold"
                        : isDueToday
                        ? "text-blue-600 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    <Calendar size={14} />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Notes */}
                {task.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                    <span className="break-words">{task.notes}</span>
                  </div>
                )}

                {canUseGoogleCalendar && task.dueDate && !task.completed && (
                  <button
                    type="button"
                    onClick={() => handleAddToCalendar(task)}
                    disabled={calendarBusyId === task.id || !gapiReady}
                    className="mt-3 flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
                  >
                    {calendarBusyId === task.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CalendarPlus size={14} />
                    )}
                    {task.calendarEventId
                      ? "Synced to Google Calendar"
                      : "Add to Google Calendar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500 text-lg">
              No tasks found. Add your first task to get started!
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Notification Settings
              </h2>
              <button
                onClick={() => setShowNotificationSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {canUseGoogleCalendar && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="syncCalendar"
                    checked={notificationSettings.syncToGoogleCalendar}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        syncToGoogleCalendar: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="syncCalendar" className="text-sm text-gray-700">
                    Auto-add new tasks with due dates to Google Calendar
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remind me before due date
                </label>
                <select
                  value={notificationSettings.daysBefore}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      daysBefore: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="0">On due date only</option>
                  <option value="1">1 day before</option>
                  <option value="2">2 days before</option>
                  <option value="3">3 days before</option>
                  <option value="7">1 week before</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How notifications work:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• You'll be notified once per day for each task</li>
                  <li>• Overdue tasks will show as "OVERDUE"</li>
                  <li>• Priority A tasks require interaction to dismiss</li>
                  <li>• Works even when the app is closed</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setShowNotificationSettings(false);
                  checkDueTasks(); // Check immediately after settings change
                }}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Backup & Restore
              </h2>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-white-500 hover:text-white-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Backup Code
                </label>
                <div className="bg-gray-100 p-3 rounded-lg break-all text-sm font-mono max-h-32 overflow-y-auto text-gray-800">
                  {backupCode || "Generating..."}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCode);
                    alert("Copied to clipboard!");
                  }}
                  className="mt-2 text-sm text-white-600 hover:text-white-700"
                >
                  Copy to clipboard
                </button>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restore from Backup
                </label>
                <textarea
                  placeholder="Paste backup code here..."
                  value={restoreCode}
                  onChange={(e) => setRestoreCode(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={loadSyncCode}
                  className="mt-2 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Restore Tasks
                </button>
              </div>

              <p className="text-xs text-gray-500">
                💡 Save this code as a backup. You can restore your tasks
                anytime by pasting it here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABCDTodoApp;
