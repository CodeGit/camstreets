import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";

// src/components/schools/schoolForm.tsx
export default function SchoolForm({
  action,
  error,
  title = "Create a school",
  description = "Add a new school to Cambridge school streets.",
  submitLabel,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  submitLabel: string;
  error?: string;
  title?: string;
  description?: string;
  defaultValues?: { name?: string; street?: string; city?: string };
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>Something went wrong. Code: {error}.</AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School name</Label>
              <Input id="name" name="name" required defaultValue={defaultValues?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input id="street" name="street" defaultValue={defaultValues?.street} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Town/City</Label>
              <Input id="city" name="city" defaultValue={defaultValues?.city} />
            </div>
            
            <Button type="submit" className="w-full">
              {submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}