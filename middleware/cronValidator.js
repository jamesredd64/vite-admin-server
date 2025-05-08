const cronValidator = (req, res, next) => {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

  if (req.body?.autoEvent?.scheduleFrequency) {
    const { morning, afternoon } = req.body.autoEvent.scheduleFrequency;
    
    if (morning && !cronRegex.test(morning)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid morning cron expression'
      });
    }
    
    if (afternoon && !cronRegex.test(afternoon)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid afternoon cron expression'
      });
    }
  }
  
  next();
};

module.exports = cronValidator;