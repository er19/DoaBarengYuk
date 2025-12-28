<template>
  <div class="flex justify-center items-center h-screen w-full bg-slate-200">
    <div
      class="grid grid-cols-2 items-center p-12 bg-slate-300 rounded-xl shadow-xl"
    >
      <div class="min-h-full p-4 mx-12">
        <div class="text-xl">DoaBarengYuk</div>
        <h1 class="text-3xl text-center font-semibold mt-8">Sign up</h1>
        <div class="mt-8">
          Already have an account? <ULink to="login">Log in</ULink>
        </div>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 items-center mt-8"
          @submit="onSubmit"
        >
          <UFormField label="Name" name="name">
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput v-model="state.email" class="w-full" />
          </UFormField>
          <UFormField label="Password" name="password">
            <UInput v-model="state.password" type="password" class="w-full" />
          </UFormField>
          <UFormField label="Confirm Password" name="confirmpassword">
            <UInput
              v-model="state.confirmPassword"
              type="password"
              class="w-full"
            />
          </UFormField>
          <br />
          <UButton type="submit"> Register </UButton>
        </UForm>
      </div>
      <div><NuxtImg src="/images/loginpage.jpg"></NuxtImg></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "../../lib/auth-client";
const schema = z
  .object({
    name: z.string("Please input your name"),
    email: z.email("Invalid email"),
    password: z
      .string("Password is required")
      .min(8, "Must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
  confirmPassword: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await authClient.signUp.email({
    name: event.data.name, // required
    email: event.data.email, // required
    password: event.data.password, // required
    callbackURL: "/login",
  });
  if (error!) {
    toast.add({
      title: "Success",
      description: "The form has been submitted.",
      color: "success",
    });
    console.log(event.data);
  }
}
</script>
