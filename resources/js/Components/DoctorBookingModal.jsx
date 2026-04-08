import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Form, Input, Modal, Radio, Row, Select, Space, Typography, message } from 'antd';

const { Paragraph } = Typography;

const consultationTypes = [
    { value: 'in-person', label: 'In Person' },
    { value: 'online', label: 'Online' },
    { value: 'phone', label: 'Phone' },
];

const ONLINE_DISCOUNT_PERCENT = 10;

const getPricingSummary = (amount, paymentMethod) => {
    const baseAmount = Number(amount || 0);
    const discountAmount = paymentMethod === 'online'
        ? Number(((baseAmount * ONLINE_DISCOUNT_PERCENT) / 100).toFixed(2))
        : 0;

    return {
        baseAmount,
        discountAmount,
        payableAmount: Number(Math.max(baseAmount - discountAmount, 0).toFixed(2)),
    };
};

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const groupSlots = (slots = []) => {
    const groups = {
        Morning: [],
        Afternoon: [],
        Evening: [],
    };

    slots.forEach((slot) => {
        const hour = parseInt(String(slot?.time || '00:00').split(':')[0], 10);

        if (hour < 12) {
            groups.Morning.push(slot);
        } else if (hour < 17) {
            groups.Afternoon.push(slot);
        } else {
            groups.Evening.push(slot);
        }
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
};

export default function DoctorBookingModal({ doctor, open, onClose }) {
    const [bookingSaving, setBookingSaving] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [bookingForm] = Form.useForm();

    const clinicSchedules = doctor?.clinic_schedules || [];
    const bookableClinics = useMemo(
        () => clinicSchedules.filter((clinic) => Array.isArray(clinic.schedules) && clinic.schedules.length > 0),
        [clinicSchedules],
    );
    const selectedPaymentMethod = Form.useWatch('payment_method', bookingForm) || 'online';
    const selectedClinic = bookableClinics.find((clinic) => String(clinic.id) === String(selectedClinicId)) || bookableClinics[0] || null;
    const pricing = getPricingSummary(selectedClinic?.consultation_fee || doctor?.consultation_fee, selectedPaymentMethod);

    useEffect(() => {
        if (!open || !doctor) {
            return;
        }

        if (!bookableClinics.length) {
            setSelectedClinicId(null);
            setSelectedDate('');
            setAvailableSlots([]);
            bookingForm.resetFields();
            return;
        }

        const initialClinic = bookableClinics[0];
        const initialDate = new Date().toISOString().slice(0, 10);

        setSelectedClinicId(initialClinic.id);
        setSelectedDate(initialDate);
        setAvailableSlots([]);
        bookingForm.setFieldsValue({
            clinic_id: initialClinic.id,
            appointment_date: initialDate,
            appointment_time: null,
            consultation_type: doctor.is_available_online ? 'online' : 'in-person',
            payment_method: 'online',
            reason_for_visit: '',
        });
    }, [bookingForm, bookableClinics, doctor, open]);

    useEffect(() => {
        if (!open || !selectedClinicId || !selectedDate) {
            return;
        }

        const fetchAvailableSlots = async () => {
            setSlotsLoading(true);

            try {
                const response = await window.axios.get(`/patient/data/clinics/${selectedClinicId}/available-slots`, {
                    params: { date: selectedDate },
                });

                const slots = response?.data?.slots || [];
                setAvailableSlots(slots);

                const currentSlot = bookingForm.getFieldValue('appointment_time');
                if (currentSlot && !slots.some((slot) => slot.time === currentSlot)) {
                    bookingForm.setFieldValue('appointment_time', null);
                }
            } catch (error) {
                setAvailableSlots([]);
                message.error(error?.response?.data?.message || 'Failed to load available slots.');
            } finally {
                setSlotsLoading(false);
            }
        };

        fetchAvailableSlots();
    }, [bookingForm, open, selectedClinicId, selectedDate]);

    const handleClose = () => {
        setAvailableSlots([]);
        setSelectedClinicId(null);
        setSelectedDate('');
        bookingForm.resetFields();
        onClose?.();
    };

    const confirmBooking = async () => {
        if (!doctor) {
            return;
        }

        try {
            const values = await bookingForm.validateFields();
            setBookingSaving(true);

            const bookingParams = {
                type: 'appointment',
                payment_method: values.payment_method,
                doctor_hospital_clinic_id: values.clinic_id,
                appointment_date: values.appointment_date,
                appointment_time: values.appointment_time,
                consultation_type: values.consultation_type,
                reason_for_visit: values.reason_for_visit,
            };

            const orderRes = await window.axios.post('/patient/data/payment/create-order', bookingParams);
            const orderData = orderRes.data;

            if (orderData.skip_payment) {
                await window.axios.post('/patient/data/appointments', {
                    doctor_hospital_clinic_id: values.clinic_id,
                    appointment_date: values.appointment_date,
                    appointment_time: values.appointment_time,
                    consultation_type: values.consultation_type,
                    reason_for_visit: values.reason_for_visit,
                    payment_method: values.payment_method === 'online' ? undefined : 'cod',
                });

                message.success(values.payment_method === 'online'
                    ? 'Appointment booked successfully.'
                    : 'Appointment booked successfully. Please pay at the clinic during your visit.');
                handleClose();
                return;
            }

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                message.error('Could not load payment gateway. Please try again.');
                return;
            }

            await new Promise((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: orderData.key_id,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'Hello Doctors',
                    description: `Appointment with ${doctor.name}`,
                    handler: async (response) => {
                        try {
                            await window.axios.post('/patient/data/payment/verify', {
                                ...bookingParams,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            message.success('Appointment booked and payment successful!');
                            handleClose();
                            resolve();
                        } catch (error) {
                            message.error(error?.response?.data?.message || 'Payment was captured but booking failed.');
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            message.warning('Payment was not completed. Your slot has not been booked.');
                            resolve();
                        },
                    },
                    theme: { color: '#1677ff' },
                });

                rzp.open();
            });
        } catch (error) {
            if (error?.errorFields) {
                return;
            }

            message.error(error?.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setBookingSaving(false);
        }
    };

    if (!doctor) {
        return null;
    }

    return (
        <Modal
            title={`Book Appointment with ${doctor.name}`}
            open={open}
            onCancel={handleClose}
            onOk={confirmBooking}
            okText="Confirm Booking"
            confirmLoading={bookingSaving}
            okButtonProps={{ disabled: slotsLoading || !selectedClinic || availableSlots.length === 0 || bookableClinics.length === 0 }}
            width={720}
            destroyOnClose
        >
            {!bookableClinics.length ? (
                <Alert
                    type="warning"
                    showIcon
                    message="No appointment slots are currently available for this doctor."
                />
            ) : (
                <Form form={bookingForm} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Select Clinic"
                                name="clinic_id"
                                rules={[{ required: true, message: 'Please select a clinic.' }]}
                            >
                                <Select
                                    placeholder="Choose clinic"
                                    options={bookableClinics.map((clinic) => ({
                                        value: clinic.id,
                                        label: `${clinic.hospital_clinic_name}${clinic.city ? ` - ${clinic.city}` : ''}`,
                                    }))}
                                    onChange={(value) => {
                                        setSelectedClinicId(value);
                                        bookingForm.setFieldValue('appointment_time', null);
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Appointment Date"
                                name="appointment_date"
                                rules={[{ required: true, message: 'Please select an appointment date.' }]}
                            >
                                <Input
                                    type="date"
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSelectedDate(value);
                                        bookingForm.setFieldValue('appointment_date', value);
                                        bookingForm.setFieldValue('appointment_time', null);
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {selectedClinic && (
                        <Card size="small" style={{ marginBottom: 16, background: '#f8fbff' }}>
                            <strong>{selectedClinic.hospital_clinic_name}</strong>
                            <div>{[selectedClinic.city, selectedClinic.address].filter(Boolean).join(' | ')}</div>
                            <div style={{ marginTop: 4 }}>Consultation Fee: ₹{selectedClinic.consultation_fee || doctor.consultation_fee || 0}</div>
                        </Card>
                    )}

                    <Form.Item name="appointment_time" rules={[{ required: true, message: 'Please select an available slot.' }]} hidden>
                        <Input type="hidden" />
                    </Form.Item>

                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Available Slots</div>
                        {slotsLoading ? (
                            <Paragraph type="secondary">Loading available slots...</Paragraph>
                        ) : availableSlots.length > 0 ? (
                            groupSlots(availableSlots).map(([label, slots]) => (
                                <div key={label} style={{ marginBottom: 12 }}>
                                    <div style={{ fontWeight: 500, marginBottom: 8 }}>{label}</div>
                                    <Space wrap>
                                        {slots.map((slot) => {
                                            const slotValue = slot.time;
                                            const isSelected = bookingForm.getFieldValue('appointment_time') === slotValue;

                                            return (
                                                <button
                                                    key={`${label}-${slotValue}`}
                                                    type="button"
                                                    className={`doctor-schedule-time-btn ${isSelected ? 'is-selected' : ''}`}
                                                    onClick={() => bookingForm.setFieldValue('appointment_time', slotValue)}
                                                >
                                                    {slot.label || slot.time}
                                                </button>
                                            );
                                        })}
                                    </Space>
                                </div>
                            ))
                        ) : (
                            <Empty description="No slots available for the selected date." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}

                        {bookingForm.getFieldError('appointment_time').length > 0 && (
                            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
                                {bookingForm.getFieldError('appointment_time')[0]}
                            </div>
                        )}
                    </div>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Consultation Type"
                                name="consultation_type"
                                rules={[{ required: true, message: 'Please select consultation type.' }]}
                            >
                                <Select
                                    options={consultationTypes.filter((option) => doctor.is_available_online || option.value !== 'online')}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Payment Method" name="payment_method">
                                <Radio.Group>
                                    <Space direction="vertical">
                                        <Radio value="online">Pay Online ({ONLINE_DISCOUNT_PERCENT}% off)</Radio>
                                        <Radio value="cod">Pay at Clinic</Radio>
                                    </Space>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Alert
                        type={selectedPaymentMethod === 'online' ? 'success' : 'warning'}
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={selectedPaymentMethod === 'online'
                            ? `You save ₹${pricing.discountAmount.toFixed(2)} with online payment.`
                            : 'No discount is applied for pay-at-clinic bookings.'}
                    />

                    <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="Refund Policy"
                        description="For online payments only: cancel more than 1 hour before the appointment to get a 90% refund; within 1 hour, you get an 80% refund. No refund applies for pay-at-clinic bookings or after the visit time."
                    />

                    <Form.Item label="Reason for Visit" name="reason_for_visit">
                        <Input.TextArea rows={3} placeholder="Describe symptoms or consultation reason" />
                    </Form.Item>

                    <div style={{ background: '#fafafa', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>Consultation Fee</span>
                            <strong>₹{pricing.baseAmount.toFixed(2)}</strong>
                        </div>
                        {selectedPaymentMethod === 'online' && pricing.discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#389e0d' }}>
                                <span>Online Payment Discount</span>
                                <strong>-₹{pricing.discountAmount.toFixed(2)}</strong>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>Payable Amount</span>
                            <span>₹{pricing.payableAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </Form>
            )}
        </Modal>
    );
}
