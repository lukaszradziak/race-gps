import { Card } from "../components/Card.tsx";
import { Button } from "../components/Button.tsx";
import { useSettingReducer } from "../reducers/useSettingsReducer.ts";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";
import { Info } from "../components/Info.tsx";
import { twMerge } from "tailwind-merge";

type FormValues = {
  speed: { start: number; end: number }[];
  testMode: boolean;
  weight: number;
  speedOn3000rpm: number;
  cx: number;
  frontalSurface: number;
  testWheelLoss: number;
  testPowerFac: number;
  airDensity: number;
};

function Label({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={twMerge(
        `block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2`,
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

interface RowOptions {
  label?: string;
}

function Row({
  label,
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & RowOptions) {
  return (
    <div
      className={twMerge(`space-y-6 sm:space-y-5 pt-3`, className)}
      {...props}
    >
      <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:border-gray-200 sm:pt-5">
        {label ? <Label>{label}</Label> : null}
        <div className="mt-1 sm:col-span-2 sm:mt-0">{children}</div>
      </div>
    </div>
  );
}

export function Settings() {
  const [message, setMessage] = useState("");
  const [state, dispatch] = useSettingReducer();
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: state,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "speed",
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    dispatch({ type: "save", payload: { ...data } });
    setMessage("Success");
  };

  const onReset = () => {
    dispatch({ type: "reset" });
    setMessage("Success");
  };

  useEffect(() => {
    reset(state);
  }, [state, reset]);

  return (
    <>
      {message ? <Info>{message}</Info> : null}
      <Card title="Settings">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Row label="Speed list">
            {fields.map((item, index) => (
              <div key={item.id} className="flex my-2 gap-2">
                <input
                  {...register(`speed.${index}.start`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
                <input
                  {...register(`speed.${index}.end`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                />
                <Button onClick={() => remove(index)}>
                  <TrashIcon className="h-3 w-3 text-white" />
                </Button>
              </div>
            ))}
            <Button onClick={() => append({ start: 0, end: 100 })}>
              <PlusIcon className="h-3 w-3 text-white" />
            </Button>
          </Row>
          <Row label="Test mode">
            <input
              type="checkbox"
              {...register(`testMode`)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
          </Row>
          <Row label="Weight">
            <input
              type="number"
              step="0.01"
              {...register(`weight`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Speed on 3000 rpm">
            <input
              type="number"
              step="0.01"
              {...register(`speedOn3000rpm`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Cx">
            <input
              type="number"
              step="0.01"
              {...register(`cx`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Frontal surface">
            <input
              type="number"
              step="0.01"
              {...register(`frontalSurface`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Test wheel loss">
            <input
              type="number"
              step="0.0001"
              {...register(`testWheelLoss`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Test power factor">
            <input
              type="number"
              step="0.001"
              {...register(`testPowerFac`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <Row label="Air density">
            <input
              type="number"
              step="0.0001"
              {...register(`airDensity`, {
                required: true,
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </Row>
          <div className="pt-5">
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={onReset} variant="white">
                Reset to default
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </Card>
    </>
  );
}
