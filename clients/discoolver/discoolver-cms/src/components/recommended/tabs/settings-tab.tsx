"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { BusinessState } from "@/types";
import { Copy, Plus, X } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { BusinessFormValues } from "../business-form-schema";

const DAYS = [
  { short: "Lun", lockKey: "mondayLock", dataKey: "mondayData" },
  { short: "Mar", lockKey: "tuesdayLock", dataKey: "tuesdayData" },
  { short: "Mié", lockKey: "wednesdayLock", dataKey: "wednesdayData" },
  { short: "Jue", lockKey: "thursdayLock", dataKey: "thursdayData" },
  { short: "Vie", lockKey: "fridayLock", dataKey: "fridayData" },
  { short: "Sáb", lockKey: "saturdayLock", dataKey: "saturdayData" },
  { short: "Dom", lockKey: "sundayLock", dataKey: "sundayData" },
] as const;

interface Props {
  states: BusinessState[];
  isLoadingStates: boolean;
}

export const SettingsTab = memo(function SettingsTab({
  states,
  isLoadingStates,
}: Props) {
  const form = useFormContext<BusinessFormValues>();

  const [scheduleMode, setScheduleMode] = useState<"horario" | "evento">(() => {
    const v = form.getValues("schedule");
    return Array.isArray(v) && v.length > 0 ? "evento" : "horario";
  });
  const [inputDate, setInputDate] = useState("");
  const [inputStartTime, setInputStartTime] = useState("");
  const [inputEndTime, setInputEndTime] = useState("");

  // Watch all day lock/data fields at top level to avoid form.watch() inside JSX render callbacks
  const [
    mondayLock,
    tuesdayLock,
    wednesdayLock,
    thursdayLock,
    fridayLock,
    saturdayLock,
    sundayLock,
    mondayData,
    tuesdayData,
    wednesdayData,
    thursdayData,
    fridayData,
    saturdayData,
    sundayData,
  ] = useWatch({
    name: [
      "mondayLock",
      "tuesdayLock",
      "wednesdayLock",
      "thursdayLock",
      "fridayLock",
      "saturdayLock",
      "sundayLock",
      "mondayData",
      "tuesdayData",
      "wednesdayData",
      "thursdayData",
      "fridayData",
      "saturdayData",
      "sundayData",
    ],
    control: form.control,
  });

  const switchToHorario = () => {
    form.setValue("schedule", null, { shouldDirty: true });
    setScheduleMode("horario");
  };

  const switchToEvento = () => {
    DAYS.forEach((d) => {
      form.setValue(d.dataKey as keyof BusinessFormValues, null, {
        shouldDirty: true,
      });
      form.setValue(d.lockKey as keyof BusinessFormValues, false, {
        shouldDirty: true,
      });
    });
    setScheduleMode("evento");
  };

  const lockValues = useMemo<Record<string, boolean>>(
    () => ({
      mondayLock: !!mondayLock,
      tuesdayLock: !!tuesdayLock,
      wednesdayLock: !!wednesdayLock,
      thursdayLock: !!thursdayLock,
      fridayLock: !!fridayLock,
      saturdayLock: !!saturdayLock,
      sundayLock: !!sundayLock,
    }),
    [
      mondayLock,
      tuesdayLock,
      wednesdayLock,
      thursdayLock,
      fridayLock,
      saturdayLock,
      sundayLock,
    ],
  );
  const dataValues = useMemo<Record<string, string | null>>(
    () => ({
      mondayData: mondayData as string | null,
      tuesdayData: tuesdayData as string | null,
      wednesdayData: wednesdayData as string | null,
      thursdayData: thursdayData as string | null,
      fridayData: fridayData as string | null,
      saturdayData: saturdayData as string | null,
      sundayData: sundayData as string | null,
    }),
    [
      mondayData,
      tuesdayData,
      wednesdayData,
      thursdayData,
      fridayData,
      saturdayData,
      sundayData,
    ],
  );

  const copySource = useMemo(
    () =>
      DAYS.find((d) => {
        if (lockValues[d.lockKey]) return false;
        const raw = dataValues[d.dataKey] || "";
        const [start, end] = raw.includes(" - ") ? raw.split(" - ") : [raw, ""];
        return !!start && !!end;
      }),
    [lockValues, dataValues],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estado y Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                    disabled={isLoadingStates}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingStates
                              ? "Cargando estados..."
                              : "Selecciona un estado"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states?.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stateCheck"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Check</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value || 0}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="youGoingWith"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Con Quién Vas (IDs)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="1,2,3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bestTimeOfTheYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mejor Época del Año</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stayTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo de Estancia</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Disponibilidad</CardTitle>
              <p className="text-sm text-muted-foreground">
                Elige entre horario semanal o fechas específicas
              </p>
            </div>
            <div className="flex rounded-md border overflow-hidden text-sm">
              <button
                type="button"
                onClick={switchToHorario}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  scheduleMode === "horario"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                Horario
              </button>
              <button
                type="button"
                onClick={switchToEvento}
                className={cn(
                  "px-3 py-1.5 transition-colors border-l",
                  scheduleMode === "evento"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                Evento puntual
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {scheduleMode === "horario" ? (
            <>
              {copySource && (
                <div className="flex justify-end mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const value = form.getValues(
                        copySource.dataKey as keyof BusinessFormValues,
                      ) as string;
                      DAYS.forEach((d) => {
                        if (
                          d.dataKey !== copySource.dataKey &&
                          !form.getValues(d.lockKey as keyof BusinessFormValues)
                        ) {
                          form.setValue(
                            d.dataKey as keyof BusinessFormValues,
                            value,
                            { shouldDirty: true },
                          );
                        }
                      });
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar a otros días
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                {DAYS.map((day) => {
                  const isLocked = lockValues[day.lockKey];
                  return (
                    <div
                      key={day.lockKey}
                      className={`flex flex-col rounded-lg border p-3 transition-all ${
                        isLocked
                          ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                          : "border-green-500 bg-green-50 dark:bg-green-950/20"
                      }`}
                    >
                      <span className="text-base font-semibold text-center mb-2">
                        {day.short}
                      </span>
                      <FormField
                        control={form.control}
                        name={day.dataKey as keyof BusinessFormValues}
                        render={({ field }) => {
                          const raw = (field.value as string) || "";
                          const [start, end] = raw.includes(" - ")
                            ? raw.split(" - ")
                            : [raw, ""];
                          const handleChange = (
                            part: "start" | "end",
                            value: string,
                          ) => {
                            const newStart = part === "start" ? value : start;
                            const newEnd = part === "end" ? value : end;
                            if (!newStart && !newEnd) {
                              field.onChange(null);
                            } else {
                              field.onChange(`${newStart} - ${newEnd}`);
                            }
                          };
                          return (
                            <FormItem className="mb-2">
                              <div className="flex flex-col items-center gap-1">
                                <FormControl>
                                  <Input
                                    type="time"
                                    value={start}
                                    onChange={(e) =>
                                      handleChange("start", e.target.value)
                                    }
                                    disabled={isLocked}
                                    className="text-xs h-7 px-1 w-full"
                                  />
                                </FormControl>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  -
                                </span>
                                <Input
                                  type="time"
                                  value={end}
                                  onChange={(e) =>
                                    handleChange("end", e.target.value)
                                  }
                                  disabled={isLocked}
                                  className="text-xs h-7 px-1 w-full"
                                />
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={day.lockKey as keyof BusinessFormValues}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-center items-center">
                              <FormControl>
                                <Switch
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                            <p className="mt-1 text-xs font-medium text-center text-muted-foreground">
                              {field.value ? "Bloqueado" : "Disponible"}
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => {
                const dates: string[] = Array.isArray(field.value)
                  ? field.value
                  : [];

                const addDate = () => {
                  if (!inputDate) return;
                  const [year, month, day] = inputDate.split("-");
                  const timePart =
                    inputStartTime && inputEndTime
                      ? ` ${inputStartTime} - ${inputEndTime}`
                      : "";
                  const formatted = `${day}/${month}/${year}${timePart}`;
                  if (!dates.includes(formatted)) {
                    field.onChange([...dates, formatted]);
                  }
                  setInputDate("");
                  setInputStartTime("");
                  setInputEndTime("");
                };

                const removeDate = (date: string) => {
                  field.onChange(dates.filter((d) => d !== date));
                };

                return (
                  <FormItem>
                    <div className="flex flex-wrap gap-2 items-center">
                      <FormControl>
                        <Input
                          type="date"
                          value={inputDate}
                          onChange={(e) => setInputDate(e.target.value)}
                          className="w-auto"
                        />
                      </FormControl>
                      <Input
                        type="time"
                        value={inputStartTime}
                        onChange={(e) => setInputStartTime(e.target.value)}
                        className="w-auto"
                      />
                      <span className="text-sm text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={inputEndTime}
                        onChange={(e) => setInputEndTime(e.target.value)}
                        className="w-auto"
                      />
                      <Button type="button" variant="outline" onClick={addDate}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {dates.map((date) => (
                          <span
                            key={date}
                            className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                          >
                            {date}
                            <button
                              type="button"
                              onClick={() => removeDate(date)}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
});
