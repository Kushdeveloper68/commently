// Reserved Subscription.plan value used exclusively for negotiated
// custom-plan (customPlanOverride) renewal payments — see
// paymentController.js's renewCustomPlanOrder/verifyPayment and
// jobs/customPlanScheduler.js. Never a real purchasable plan key: it must
// never resolve via getPlanLimitsByKey, and its Subscription records never
// drive `user.plan` the way a normal plan purchase does.
export const CUSTOM_OVERRIDE_PLAN_KEY = "custom_override";
