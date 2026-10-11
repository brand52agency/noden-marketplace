import assert from "node:assert/strict";
import { isDisposableEmail, normalizeEmail } from "../lib/email-policy";

// Aliases of one inbox must collapse to one trial claim.
assert.equal(normalizeEmail("Jane.Doe+promo@Gmail.com"), "janedoe@gmail.com");
assert.equal(normalizeEmail("j.a.n.e.d.o.e@googlemail.com"), "janedoe@gmail.com");
assert.equal(normalizeEmail("janedoe+a+b@gmail.com"), "janedoe@gmail.com");
assert.equal(normalizeEmail("  Person+x@Example.com "), "person@example.com");
assert.equal(normalizeEmail("first.last@company.com"), "first.last@company.com"); // dots matter outside gmail
assert.notEqual(normalizeEmail("a@gmail.com"), normalizeEmail("a@yahoo.com"));
assert.equal(isDisposableEmail("x@mailinator.com"), true);
assert.equal(isDisposableEmail("x@MAILINATOR.com"), true);
assert.equal(isDisposableEmail("x@gmail.com"), false);
assert.equal(isDisposableEmail("agent-ab12@example.invalid"), true);
console.log("email-policy: all assertions passed");
