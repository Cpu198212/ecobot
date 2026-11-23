import { createFileRoute } from "@tanstack/react-router";
import { EcosortApp } from "@/components/ecosort-app";

export const Route = createFileRoute("/")({ component: EcosortApp });
