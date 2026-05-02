"use client";

import { pingVisitGeo } from "@/app/actions/visit";
import { useEffect, useRef } from "react";

/** 서버 액션으로 일·국가별 방문 1 카운트(탭당 1회) */
export default function GeoVisitBeacon() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void pingVisitGeo();
  }, []);

  return null;
}
