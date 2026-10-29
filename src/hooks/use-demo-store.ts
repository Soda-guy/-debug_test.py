"use client";

import { useSyncExternalStore } from "react";
import { getState, subscribe, type DemoState } from "@/lib/demo/store";

export function useDemoStore(): DemoState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useDemoUser() {
  const state = useDemoStore();
  return state.user;
}
