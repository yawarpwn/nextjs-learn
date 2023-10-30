'use server'

import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error:
      'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, {
    message: 'Amount must be greater than 0',
  }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error:
      'Please select a valid status',
  }),
  date: z.string(),
})

// This is temporary until @types/react-dom is updated
type State = {
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}

const CreateInvoice = InvoiceSchema.omit({
  id: true,
  date: true,
})

export async function createInvoice(
  prevState: State,
  formData: FormData,
) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  }

  // Validate form fields using Zod
  const validatedFields =
    CreateInvoice.safeParse(rawFormData)

  console.log('validatedFields', validatedFields)

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors:
        validatedFields.error.flatten()
          .fieldErrors,
      message:
        'Missing Fields. Failed to Create Invoice.',
    }
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } =
    validatedFields.data

  const amountInCents = amount * 100
  const date = new Date()
    .toISOString()
    .split('T')[0]

  // Insert data into the database
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message:
        'Database Error: Failed to create invoice',
    }
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const UpdateInvoice = InvoiceSchema.omit({
  date: true,
})

export async function updateInvoice(
  prevState: State,
  formdata: FormData,
) {
  const rawFormData = {
    id: formdata.get('id'),
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  }

  const validatedFields =
    UpdateInvoice.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      errors:
        validatedFields.error.flatten()
          .fieldErrors,
      message:
        'Missing Fields. Failed to Create Invoice.',
    }
  }

  const { id, customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100

  try {
    await sql`
    UPDATE invoices 
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
    `
  } catch (error) {
    return {
      message:
        'Database Error: Failed to Update Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const DeleteInvoice = InvoiceSchema.pick({
  id: true,
})

export async function deleteInvoice(
  formData: FormData,
) {
  throw new Error('Failed to deleted')
  const { id } = DeleteInvoice.parse({
    id: formData.get('id'),
  })

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
    revalidatePath('/dashboard/invoices')
    return { message: 'Deleted Invoice.' }
  } catch (error) {
    return {
      message:
        'Database Error: Failed to Delete Invoice.',
    }
  }
}
