'use server'

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod'

const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()

})

const CreateInvoice = invoiceSchema.omit({id: true, date: true})

export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };

  const {customerId, amount, status} = CreateInvoice.parse(rawFormData)
  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
  `

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
  
}

const UpdateInvoice = invoiceSchema.omit({date: true})

export async function updateInvoice(formdata: FormData) {
  const rawFormData = {
    id: formdata.get('id'),
    customerId: formdata.get('customerId'),
    amount: formdata.get('amount'),
    status: formdata.get('status'),
  };

  const {id, customerId, amount, status} = UpdateInvoice.parse(rawFormData)
  const amountInCents = amount * 100

  await sql`
  UPDATE invoices 
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
  
}

export async function deleteInvoice (formData: FormData) {
  console.log('formData', formData)
  const id = formData.get('id')?.toString()
  await sql`DELETE FROM invoices WHERE id = ${id}`
  revalidatePath('/dashboard/invoices')
}
