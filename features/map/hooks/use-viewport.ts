"use client";

import { useMapStore } from "../store";
import type { ViewState } from "../types";

export function useViewport() {
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);

  function onMove(evt: { viewState: ViewState }) {
    setViewState(evt.viewState);
  }

  return { viewState, onMove };
}
