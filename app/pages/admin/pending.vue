<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Pending User Approvals</h1>

    <div v-if="pending">
      <p v-if="!approvals || approvals.length === 0" class="text-gray-600">
        No pending approvals.
      </p>

      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                User
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Signed Up
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in approvals" :key="item.approval.id">
              <td class="px-6 py-4 whitespace-nowrap">
                {{ item.user.name || "N/A" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ item.user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ formatDate(item.approval.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="approveUser(item.approval.token)"
                  :disabled="approving === item.approval.token"
                  class="text-green-600 hover:text-green-900 disabled:opacity-50"
                >
                  {{
                    approving === item.approval.token
                      ? "Approving..."
                      : "Approve"
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const approving = ref<string | null>(null);
import { user, pendingUserApproval } from "../../../lib/db/index";
type userType = typeof user.$inferSelect;
type pendingUserType = typeof pendingUserApproval.$inferSelect;
// Combined type for API response
interface PendingApprovalWithUser {
  approval: pendingUserType;
  user: userType;
}

// API response types
interface ApprovalSuccessResponse {
  success: true;
  message: string;
  user: { id: string; email: string; name: string | null; approvedAt: Date };
}
// Fetch pending approvals
const {
  data: approvals,
  pending,
  refresh,
} = await useFetch<PendingApprovalWithUser[]>("/api/admin/pending");

// Format date helper
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString();
};

// Approve user function
const approveUser = async (token: string) => {
  if (!confirm("Are you sure you want to approve this user?")) {
    return;
  }

  approving.value = token;

  try {
    const response = await $fetch<ApprovalSuccessResponse>(
      "/api/admin/approve",
      {
        method: "POST",
        body: { token },
      }
    );

    alert(`User ${response.user.email} approved successfully!`);

    // Refresh the list
    await refresh();
  } catch (error: any) {
    alert(`Error: ${error.data?.statusMessage || "Failed to approve user"}`);
  } finally {
    approving.value = null;
  }
};

useHead({
  title: "Pending Approvals",
});
</script>
