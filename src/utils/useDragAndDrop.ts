import React, { useState, useCallback } from "react";

/**
 * Reusable drag-and-drop between named drop zones.
 *
 * Spread `getDragProps(itemId)` onto any draggable card and
 * `getZoneProps(zoneId)` onto each container that can receive a card.
 * When a card is dropped onto a zone, `onDrop(itemId, zoneId)` fires.
 *
 * `draggingId`  -> id of the card currently being dragged (or null)
 * `overZoneId`  -> id of the zone the card is hovering over (or null),
 *                  use it to highlight the target zone.
 *
 * Pass `enabled: false` to make every card non-draggable (e.g. when not
 * in edit mode); the returned prop getters then return empty objects.
 */
export interface UseDragAndDropOptions {
  onDrop: (itemId: string | number, zoneId: string) => void;
  enabled?: boolean;
}

export function useDragAndDrop({ onDrop, enabled = true }: UseDragAndDropOptions) {
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [overZoneId, setOverZoneId] = useState<string | null>(null);

  const getDragProps = useCallback(
    (itemId: string | number): React.HTMLAttributes<HTMLElement> & { draggable?: boolean } => {
      if (!enabled) return {};
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          setDraggingId(itemId);
          e.dataTransfer.effectAllowed = "move";
          // Some browsers require data to be set for drag to start.
          e.dataTransfer.setData("text/plain", String(itemId));
        },
        onDragEnd: () => {
          setDraggingId(null);
          setOverZoneId(null);
        },
      };
    },
    [enabled]
  );

  const getZoneProps = useCallback(
    (zoneId: string): React.HTMLAttributes<HTMLElement> => {
      if (!enabled) return {};
      return {
        onDragOver: (e: React.DragEvent) => {
          if (draggingId == null) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (overZoneId !== zoneId) setOverZoneId(zoneId);
        },
        onDragLeave: (e: React.DragEvent) => {
          // Only clear when actually leaving the zone, not when moving
          // over a child element.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setOverZoneId((prev) => (prev === zoneId ? null : prev));
          }
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          const id = draggingId;
          setDraggingId(null);
          setOverZoneId(null);
          if (id != null) onDrop(id, zoneId);
        },
      };
    },
    [enabled, draggingId, overZoneId, onDrop]
  );

  return { draggingId, overZoneId, getDragProps, getZoneProps };
}
