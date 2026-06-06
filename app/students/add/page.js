import AddStudentForm from "./AddStudentForm";

export default async function AddStudentPage() {
  const classes = [
    "Nursery",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const today = new Date().toISOString().split("T")[0];

  return <AddStudentForm classes={classes} today={today} />;
}
