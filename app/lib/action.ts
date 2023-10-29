'use server'

import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = invoiceSchema.omit({
  id: true,
  date: true,
})

export async function createInvoice(
  formData: FormData,
) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  }

  const { customerId, amount, status } =
    CreateInvoice.parse(rawFormData)
  const amountInCents = amount * 100
  const date = new Date()
    .toISOString()
    .split('T')[0]

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    return {
      message:
        'Database Error: Failed to create invoice',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const UpdateInvoice = invoiceSchema.omit({
  date: true,
})

export async function updateInvoice(
  formdata: FormData,
) {
  const rawFormData = {
    id: formdata.get('id'),
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  }

  const { id, customerId, amount, status } =
    UpdateInvoice.parse(rawFormData)
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

const DeleteInvoice = invoiceSchema.pick({
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
