<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * 账单管理
 * @author: liaoxianwen@ymt360.com
 * @version: 1.0.0
 * @since: 2015-07-20
 */
class Billing extends MY_Controller {

    public static $user_info = [];
    public function __construct() {
        parent::__construct();
        $cur = $this->userauth->current(TRUE);
        if(empty($cur)) {
            $this->_return_json(
                array(
                    'status' => C('status.auth.login_timeout'),
                    'msg'    => '登录超时，请重新登录',
                )
            );
        } else {
            self::$user_info = $cur;
        }
        $this->load->library(
            array(
                'form_validation',
            )
        );
    }

    public function search_options() {
        $conditions = $this->format_query('/billing/get_condition');
        $condition_response = array(
            'status' => $conditions['status'],
            'msg' => '账单列表搜索条件获取成功',
            'list' => $conditions['billing_status']
        );
        $this->_return_json($condition_response);
    }

    /**
     * @param currentPage 当前页
     *        itemsPerPage 每页显示数
     *        startTime 账期开始时间(可选)
     *        endTime   账期结束时间(可选)
     *        status    1 未打款  2预备打款 3已结款 4已收款(可选)
     * @description 商城账期列表
     */
    public function lists() {
        $this->form_validation->set_rules('currentPage', '当前页', 'required');
        $this->form_validation->set_rules('itemsPerPage', '每页显示数', 'required');
        //$this->form_validation->set_rules('status', '账单列表状态', 'required');
        $this->validate_form();

        $user = self::$user_info;
        $page = $this->get_page();
        $list_search_post_data = array(
            'customer_id' => $user['id']
        );
        if(!empty($this->post['startTime'])) {
            $list_search_post_data['start_time'] = $this->post['startTime'];
        }
        if(!empty($this->post['endTime'])) {
            $list_search_post_data['end_time'] = $this->post['endTime'];
        }
        if(isset($this->post['status'])) {
            $list_search_post_data['status'] = (int)$this->post['status'];
        }
        $list_search_post_data['currentPage'] = $page['page'];
        $list_search_post_data['itemsPerPage'] = $page['page_size'];
        $billing_lists_response = $this->format_query('/billing/shop_billing_list', $list_search_post_data);
        $billing_lists_response = $this->_format_billing_lists($billing_lists_response);
        $this->_return_json($billing_lists_response);
    }

    private function _format_billing_lists($billing_lists_response) {
        $new_billing_lists = array('list' => array());
        if(!empty($billing_lists_response['list'])) {
            foreach($billing_lists_response['list'] as $billing_list) {
                $year = date('Y', strtotime($billing_list['start_time']));
                $new_billing_lists['list'][$year]['year'] = $year;
                $new_billing_lists['list'][$year]['billing_list'][] = $billing_list;
            }
            $tmp_billing_lists = $new_billing_lists['list'];
            $new_billing_lists['list'] = array_values($tmp_billing_lists);
        }
        return $new_billing_lists;
    }

    private function _check_billing_customer($id) {
        $user = self::$user_info;
        $check_info = $this->format_query('/billing/check_billing_customer', array('id' => $id, 'customer_id' => $user['id']));
        if(intval($check_info['status']) !== 0) {
            $this->_return_json(
                array(
                    'status' => C('tips.code.op_failed'),
                    'msg' => '当前账单有异常'
                )
            );
        }
    }

    public function shop_agree_pay() {
        $this->form_validation->set_rules('id', '账单id', 'required');
        $this->_check_billing_customer($this->post['id']);
        $response = $this->format_query('/billing/shop_agree_pay', array('id' => $this->post['id']));
        $this->_return_json($response);
    }
    /**
     * @author: liaoxianwen@ymt360.com
     * @description 支付凭证
     */
    public function payment_evidence() {
        $this->form_validation->set_rules('id', '账单id', 'required');
        $this->form_validation->set_rules('evidence', '账单图片地址', 'required');
        $this->_check_billing_customer($this->post['id']);
        $response = $this->format_query('/billing/payment_evidence', $this->post);
        $this->_return_json($response);
    }

    /**
     * @param id  账单id
     * @param type
     *          1:按店铺显示
     *          其他: 按时间显示
     * @description 显示账单的子订单信息, 子账号只能按时间显示,母账号可以按店铺也可以按时间显示
     */
    public function get_billing_detail() {
        if(empty($this->post['id'])) {
            $this->_return_json(array('status' => -1, 'msg' => '账单不能为空！'));
        }
        //type=1 按店铺显示;  type = 0 按日期显示
        $type = (isset($this->post['type']) && $this->post['type'] == 1) ? 1 : 0;
        $account_type = self::$user_info['account_type'];
        $this->post['account_type'] = $account_type;

        //检查客户有该账单
        $this->_check_billing_customer($this->post['id']);

        if($account_type == C('customer.account_type.parent.value') && $type == 1) {
            //按店铺显示账单的子订单信息
            $response = $this->format_query('/billing/get_store_orders_of_app', $this->post);
            $this->_return_json($response);
        }
        $this->post['user_id'] = self::$user_info['id'];
        //按日期显示
        $response = $this->format_query('/billing/get_billing_detail_by_date', $this->post);
        $this->_return_json($response);
    }
}

/* End of file billing.php */
/* Location: ./application/controllers/billing.php */
