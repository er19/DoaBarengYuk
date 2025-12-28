<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <!-- Success Icon -->
      <div class="mb-6">
        <div
          class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{
          alreadyApproved ? "Already Approved" : "User Approved Successfully"
        }}
      </h1>

      <!-- Description -->
      <p class="text-gray-600 mb-6">
        {{
          alreadyApproved
            ? "This user has already been approved and can sign in to their account."
            : "The user has been notified via email and can now sign in to their account."
        }}
      </p>

      <!-- Additional Info -->
      <div
        v-if="!alreadyApproved"
        class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
      >
        <p class="text-sm text-green-800">
          ✓ Approval email sent to user<br />
          ✓ User can now sign in<br />
          ✓ Access granted
        </p>
      </div>

      <!-- Action Button -->
      <NuxtLink
        to="/admin/pending"
        class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Pending Approvals
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const alreadyApproved = computed(
  () => route.query.status === "already-approved"
);

useHead({
  title: alreadyApproved.value ? "Already Approved" : "User Approved",
});
</script>
