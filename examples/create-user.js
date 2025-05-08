const user = new UserModel({
  email: "",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "123-456-7890",
  profile: {
    dateOfBirth: new Date('1990-01-01'),
    gender: "male",
    profilePictureUrl: "https://example.com/photo.jpg",
    marketingBudget: {
      amount: 1000,
      frequency: "monthly",
      adCosts: 500
    }
  },
  address: {
    street: "123 Main St",
    city: "Boston",
    state: "MA",
    zipCode: "02108",
    country: "USA"
  }
});

await user.save();