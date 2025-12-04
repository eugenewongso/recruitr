/**
 * Notifications Dropdown Component
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, User, Search, TrendingUp, Mail, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification as NotificationType,
} from "@/services/api/researcher";

// Map notification types to icons
const getNotificationIcon = (type: string, relatedEntityType?: string) => {
  if (relatedEntityType === "search") return <Search className="h-4 w-4" />;
  if (relatedEntityType === "participant") return <User className="h-4 w-4" />;
  if (relatedEntityType === "draft") return <Mail className="h-4 w-4" />;
  if (relatedEntityType === "saved") return <Bookmark className="h-4 w-4" />;
  if (type === "success") return <Check className="h-4 w-4" />;
  return <TrendingUp className="h-4 w-4" />;
};

// Format timestamp
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      // Fetch unread count when closed
      fetchUnreadCount();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications(50, false);
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getNotifications(1, true);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-muted-foreground hover:text-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 z-50"
            >
              <Card className="shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                      />
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationType;
  onMarkAsRead: () => void;
}) {
  const icon = getNotificationIcon(notification.type, notification.related_entity_type);
  const time = formatTime(notification.created_at);

  return (
    <div
      className={cn(
        "group p-4 border-b border-border last:border-0 transition-colors cursor-pointer",
        !notification.read && "hover:bg-accent"
      )}
      onClick={onMarkAsRead}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            notification.type === "success" &&
              "bg-green-100 text-green-600",
            notification.type === "info" &&
              "bg-accent text-primary",
            notification.type === "alert" &&
              "bg-red-100 text-red-600",
            notification.type === "warning" &&
              "bg-yellow-100 text-yellow-600"
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {notification.title}
            </p>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-transparent group-hover:bg-primary rounded-full mt-1 transition-colors"></span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {time}
          </p>
        </div>

        {/* Mark as read button (on hover) */}
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
