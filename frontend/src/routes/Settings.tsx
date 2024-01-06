import { Card } from "../components/Card.tsx";
import { Button } from "../components/Button.tsx";
import {
  SettingsReducerState,
  useSettingReducer,
} from "../reducers/useSettingsReducer.ts";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { Info } from "../components/Info.tsx";
import { FormRow } from "../components/FormRow.tsx";
import { InputNumber } from "../components/InputNumber.tsx";
import { InputCheckbox } from "../components/InputCheckbox.tsx";
import { InputText } from "../components/InputText.tsx";

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

  const onSubmit: SubmitHandler<SettingsReducerState> = (data) => {
    dispatch({ type: "save", payload: { ...data } });
    setMessage("Success");
    window.scrollTo(0, 0);
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
        <form onSubmit={handleSubmit(onSubmit)} onChange={() => setMessage("")}>
          <FormRow label="Speed list">
            {fields.map((item, index) => (
              <div key={item.id} className="flex my-2 gap-2">
                <InputNumber
                  {...register(`speed.${index}.start`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                />
                <InputNumber
                  {...register(`speed.${index}.end`, {
                    required: true,
                    valueAsNumber: true,
                  })}
                />
                <Button onClick={() => remove(index)}>
                  <TrashIcon className="h-3 w-3 text-white" />
                </Button>
              </div>
            ))}
            <Button onClick={() => append({ start: 0, end: 100 })}>
              <PlusIcon className="h-3 w-3 text-white" />
            </Button>
          </FormRow>
          <FormRow label="Test mode">
            <InputCheckbox {...register(`testMode`)} />
          </FormRow>
          <FormRow label="Weight">
            <InputNumber
              step="0.01"
              {...register(`weight`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Speed on 3000 rpm">
            <InputNumber
              step="0.01"
              {...register(`speedOn3000rpm`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Cx">
            <InputNumber
              step="0.01"
              {...register(`cx`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Frontal surface">
            <InputNumber
              step="0.01"
              {...register(`frontalSurface`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Wheel loss factor">
            <InputNumber
              step="0.0001"
              {...register(`wheelLoss`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Power correction factor">
            <InputNumber
              step="0.001"
              {...register(`powerFac`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Air density">
            <InputNumber
              step="0.0001"
              {...register(`airDensity`, {
                required: true,
                valueAsNumber: true,
              })}
            />
          </FormRow>
          <FormRow label="Api enabled">
            <InputCheckbox {...register(`apiEnabled`)} />
          </FormRow>
          <FormRow label="Api automatic">
            <InputCheckbox {...register(`apiAutomatic`)} />
          </FormRow>
          <FormRow label="Air url">
            <InputText
              {...register(`apiUrl`, {
                required: false,
              })}
            />
          </FormRow>
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
