import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  useForm,
} from '../components/Form';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import styles from './dashboard.delivery.module.css';
import { useCreateDeliveryZone } from '../helpers/useCreateDeliveryZone';

const formSchema = z.object({
  zoneName: z.string().min(1, 'Zone name is required'),
  fee: z.string().min(1, 'Fee is required'),
  freeThreshold: z.string().optional(),
  estimatedDaysMin: z.string().min(1, 'Minimum days required'),
  estimatedDaysMax: z.string().min(1, 'Maximum days required'),
});

export default function DashboardDelivery() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const createZone = useCreateDeliveryZone();

  const form = useForm({
    schema: formSchema,
    defaultValues: { 
      zoneName: '', 
      fee: '',
      freeThreshold: '',
      estimatedDaysMin: '1',
      estimatedDaysMax: '3',
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    
    try {
      const feeNum = parseFloat(data.fee);
      const minDays = parseInt(data.estimatedDaysMin);
      const maxDays = parseInt(data.estimatedDaysMax);
      
      if (isNaN(feeNum) || feeNum < 0) {
        setError('Please enter a valid fee');
        return;
      }
      
      if (isNaN(minDays) || isNaN(maxDays) || minDays < 1 || maxDays < minDays) {
        setError('Please enter valid delivery days');
        return;
      }

      await createZone.mutateAsync({
        name: data.zoneName,
        fee: feeNum,
        freeDeliveryThreshold: data.freeThreshold ? parseFloat(data.freeThreshold) : undefined,
        estimatedDaysMin: minDays,
        estimatedDaysMax: maxDays,
      });
      
      // Stay on the page to add more zones or navigate to settings
      navigate('/dashboard/settings/store');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Delivery Settings — Nova Commerce</title>
      </Helmet>
      <h1 className={styles.title}>Delivery Zones</h1>
      <p className={styles.subtitle}>
        Set up how you'll deliver products to customers. Start with one zone—you can add more later.
      </p>

      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>💡 Quick Start</h4>
        <p className={styles.infoText}>
          Most Ghanaian stores start with:
        </p>
        <ul className={styles.infoList}>
          <li><strong>Accra Metro:</strong> GH₵ 10-20, 1-2 days</li>
          <li><strong>Nationwide:</strong> GH₵ 25-50, 3-5 days</li>
        </ul>
        <p className={styles.infoText}>
          You can offer free delivery for orders above a certain amount.
        </p>
      </div>

      <Form {...form}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="zoneName">
            <FormLabel>Zone name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Accra Metro, Greater Accra, Nationwide"
                value={form.values.zoneName}
                onChange={(e) => form.setValues((prev) => ({ ...prev, zoneName: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Name this delivery area (e.g., city or region).</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="fee">
            <FormLabel>Delivery fee (GH₵)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.values.fee}
                onChange={(e) => form.setValues((prev) => ({ ...prev, fee: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Charge per order in this zone.</FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem name="freeThreshold">
            <FormLabel>Free delivery threshold (optional)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 200"
                value={form.values.freeThreshold}
                onChange={(e) => form.setValues((prev) => ({ ...prev, freeThreshold: e.target.value }))}
              />
            </FormControl>
            <FormDescription>Orders above this amount get free delivery.</FormDescription>
            <FormMessage />
          </FormItem>

          <div className={styles.row}>
            <FormItem name="estimatedDaysMin">
              <FormLabel>Min. delivery days</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  value={form.values.estimatedDaysMin}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, estimatedDaysMin: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="estimatedDaysMax">
              <FormLabel>Max. delivery days</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  value={form.values.estimatedDaysMax}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, estimatedDaysMax: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.buttonGroup}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard/settings/store')}
              disabled={createZone.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createZone.isPending} className={styles.submitButton}>
              {createZone.isPending ? (
                <>
                  <Spinner size="sm" /> Saving...
                </>
              ) : (
                'Save Zone'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
