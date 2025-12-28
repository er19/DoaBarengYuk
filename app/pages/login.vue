<template>
  <div class="flex justify-center items-center h-screen w-full bg-slate-200">
    <div
      class="grid grid-cols-2 items-center p-12 bg-slate-300 rounded-xl shadow-xl"
    >
      <div class="min-h-full p-4 mx-12">
        <div class="text-xl">DoaBarengYuk</div>

        <h1 class="text-3xl text-center font-semibold mt-8">Login</h1>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4 items-center"
          @submit="onSubmit"
        >
          <UFormField label="Email" name="email">
            <UInput v-model="state.email" class="w-full" />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput v-model="state.password" type="password" class="w-full" />
          </UFormField>

          <div>Don't have an account? <ULink to="register">Sign up</ULink></div>
          <br />
          <UButton type="submit"> Submit </UButton>
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
const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await authClient.signIn.email({
    email: event.data.email,
    password: event.data.password,
    callbackURL: "/", // Where to go after success
  });

  if (error) {
    alert(error.message);
  } else {
    toast.add({
      title: "Success",
      description: "The form has been submitted.",
      color: "success",
    });
  }
}
</script>
