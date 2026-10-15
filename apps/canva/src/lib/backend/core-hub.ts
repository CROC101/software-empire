import { env } from "@/lib/env";

/// ที่อยู่หน้าเว็บของ Core Hub — ใช้กับลิงก์ "กลับ Hub" และหน้าบัญชีที่เป็นของ Hub
export const CORE_HUB_WEB_URL = env.hubUrl.replace(/\/+$/, "");
