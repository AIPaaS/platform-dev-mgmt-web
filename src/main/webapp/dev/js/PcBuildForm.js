var CurrentId = "";
var CurrentPageNum = 1;

var TreeData = null;
var SelResCenterId = null;

var mouseenter = false;
/** 初始化 **/
function init() {
	initData(function() {
		initComponent();
		initListener();
		initFace();
		if(!CU.isEmpty(CurrentId)) {
			queryInfo();
		}
		$("#div_isBuildImage_yes").show();
	});
}

/** 初始化页面、内存等基本数据 **/
function initData(cb) {
	$("#productId").html("");
	setDisabled(false);
	$("#div_isExternal_no").show();
	$("#div_isBuildImage_yes").hide();
	$("#div_isAutoPush1_yes").hide();
	CurrentId = PRQ.get("id");
	CurrentPageNum = PRQ.get("pageNum");
	if(CU.isEmpty(CurrentPageNum)) CurrentPageNum = 1;

	
	RS.ajax({url:"/dev/product/getProductDropList",ps:{addEmpty:true, addAttr:true},cb:function(rs) {
		DROP["DV_PRODUCT_CODE"] = rs;
		var selhtml = PU.getSelectOptionsHtml("DV_PRODUCT_CODE");
		$("#productId").html(selhtml);
		
		RS.ajax({url:"/res/res/getResRegionDropListMap",ps:{addEmpty:false, addAttr:true,opts:"dc|rc"},cb:function(result) {
			DROP["DV_DATA_CENTER_CODE"] = result["dc"];
			DROP["DV_RES_CENTER_CODE"] = result["rc"];
			var dropList = [];
			for(var i=0; i<result["dc"].length; i++) dropList.push(result["dc"][i]);
			for(var i=0; i<result["rc"].length; i++) dropList.push(result["rc"][i]);
			TreeData = toTreeData(dropList);
			
			if(CU.isFunction(cb))cb();
		}});
	}});

}

/** 初始化组件 **/
function initComponent() {
	$("#sel_forcenter").treeview({data:TreeData,color:"#428bca",selectedBackColor:"#f0f8ff",selectedColor:"#428bca",collapseIcon:"fa fa-minus-square-o",expandIcon:"fa fa-plus-square-o",onNodeSelected: function(e, node) {
		if(node.param1==2 || node.param1=="2") {
			SelResCenterId = node.id;
			$("#forcenter").val(node.text);
			$('#sel_forcenter').hide();
		}
	}});
	$("#sel_forcenter").treeview("collapseAll", {silent:true});
	
}

/** 对组件设置监听 **/
function initListener() {
	$("#isExternal").bind("change", resetBuildFace);
	$("#isBuildImage").bind("change",function(){
		if($("#isBuildImage").prop("checked")){
			$("#div_isBuildImage_yes").show();
		}else{
			$("#imageDefId").val("");
			$("#dockerFilePath").val("");
			$("#isAutoPush1").val("");
			$("#div_isBuildImage_yes").hide();
		}
	});
	$("#isAutoPush1").bind("change",function(){
		if($("#isAutoPush1").prop("checked")){
			$("#div_isAutoPush1_yes").show();
			
		}else{
			$("#div_isAutoPush1_yes").hide();
		}
	});
	$("#productId").bind("change",function(){
		var productId = $("#productId").val();
		var item = CU.getDropItemRecord("DV_PRODUCT_CODE", productId);
		if(!CU.isEmpty(item) && !CU.isEmpty(item.attributes)) {
			$("#buildNameText").text("/"+item.attributes.code);
			reloadProjectDropList(productId);
		}
	});
	$("#projectId").bind("change", resetBuildFace);
	//新添加构建名校验事件
	$("#buildName").bind("blur", checkBuildFullName);
	$("#depTag").bind("blur", checkDepTag);
	
	$("#forcenter").bind("focus",function(){
		var sul = $('#sel_forcenter');
		sul.css("top", $("#forcenter").offset().top-$("#forcenter").height());
		sul.css("left", $("#forcenter").offset().left-$("#forcenter").width()/2);
		sul.show(); 
	});
	$("#forcenter").on("blur", function() {
		if(!mouseenter) $("#sel_forcenter").hide();
	});
	
	$("#sel_forcenter").on("mouseenter",function(){mouseenter=true;});
	$("#sel_forcenter").on("mouseleave",function(){mouseenter=false;});
	$("#sel_forcenter").bind("click", function() {
		if(!$("#sel_forcenter").is(":hidden")) $("#forcenter").focus();
	});
	
	$("#form_buildDef").submit(function(e){
	    e.preventDefault();
	    submitForm();
	});
	RS.setAjaxLodingButton("btn_submit");
}

/** 初始化界面 **/
function initFace() {
	
}

function toTreeData(dropList) {
	var tree = [{}];
	var pnobj = {};
	for(var i=0; i<dropList.length; i++) {
		var item = dropList[i];
		var type = item.param1;
		
		item.id = item.code;
		item.text = item.name;
		
		pnobj[item.code+"_"+type] = item;
		
		if(type == "1") {
			item.icon = "fa fa-database";
			tree.push(item);
		}else {
			item.icon = type=="2" ? "fa fa-sitemap" : "fa fa-flash";
			var pn = pnobj[item.parentCode+"_"+(parseInt(type, 10)-1)];
			if(CU.isEmpty(pn)) continue ;
			if(CU.isEmpty(pn.childNodes)) pn.childNodes = [];
			pn.childNodes.push(item);
		}
	}
	return tree;
}

function setDisabled(isExternal){
	if(isExternal){
		$("#respType1").prop("disabled",!isExternal);
		$("#respType2").prop("disabled",!isExternal);
		$("#respUrl").prop("readOnly",!isExternal);
	}else{
		$("#respType1").prop("disabled",!isExternal);
		$("#respType2").prop("disabled",!isExternal);
		$("#respUrl").prop("readOnly",!isExternal);
	}
	
}

function reloadProjectDropList(productId, cb) {
	$("#projectId").val("");
	$("#projectId").html("");
	resetBuildFace();
	RS.ajax({url:"/dev/project/getProjectDropList",ps:{addEmpty:true, addAttr:true, productId:productId},cb:function(result) {
		DROP["DV_PROJECT_CODE"] = result;
		var selhtml = PU.getSelectOptionsHtml("DV_PROJECT_CODE");
		$("#projectId").html(selhtml);
		if(CU.isFunction(cb)) cb();
	}});
}

function resetBuildFace(){
	var isExternal = $("#isExternal").prop("checked");
	var projectId = $("#projectId").val();
	
	if(isExternal) {
		$("#productId").val("");
		$("#projectId").val("");
		$("#div_isExternal_no").hide();
		setDisabled(true);
	}else {
		setDisabled(false);
		$("#respUrl").val("");
		$("#div_isExternal_no").show();
	}
	if(!CU.isEmpty(projectId)) {
		var item = CU.getDropItemRecord("DV_PROJECT_CODE", projectId);
		if(!CU.isEmpty(item) && !CU.isEmpty(item.attributes)) {
			$("#respType1").prop("checked", item.attributes.respCodeType==1);
			$("#respType2").prop("checked", item.attributes.respCodeType==2);
			$("#respUrl").val(item.attributes.respCodeUrl);
			$("#buildNameText").text("/"+$("#buildNameText").text().split("/")[1]+"/"+item.attributes.code+"/");
		}
	}
	reloadDefDropList(isExternal, projectId);
}
function reloadDefDropList(isExternal, projectId, cb) {
	$("#imageDefId").html("");
	if(isExternal||isExternal=="1" || !CU.isEmpty(projectId)) {
		isExternal = isExternal||isExternal=="1" ? 1 : 0;
		RS.ajax({url:"/dev/image/getDefDropList",ps:{addEmpty:true, addAttr:true ,isExternal:isExternal,projectId:projectId},cb:function(result) {
			DROP["DV_IMAGE_CODE"] = result;
			var selhtml = PU.getSelectOptionsHtml("DV_IMAGE_CODE");
			$("#imageDefId").html(selhtml);
			if(CU.isFunction(cb)) cb();
		}});
	}
}

function queryInfo(){
	RS.ajax({url:"/dev/build/queryDefInfoById",ps:{id:CurrentId},cb:function(rs) {
		var isExternal = rs.def.isExternal;
		$("#buildNameText").text(rs.def.buildName.substr(0,rs.def.buildName.lastIndexOf("/")+1));
		$("#buildName").val(rs.def.buildName.substr(rs.def.buildName.lastIndexOf("/")+1));
		$("#imageName").val(rs.def.imageName);
		if(isExternal){
			setDisabled(true);
			$("#div_isExternal_no").hide();
			$("#isExternal").prop("checked",true);
			var respType = rs.def.respType;
			$("#respType1").prop("checked", respType==1);
			$("#respType2").prop("checked", respType==2);
			$("#respUrl").val(rs.def.respUrl);
			$("#respUser").val(rs.def.respUser);
			$("#respPwd").val(rs.def.respPwd);
		}else{
			$("#div_isExternal_no").show();
			$("#isExternal").prop("checked",false);
			$("#productId").val(rs.def.productId);
			if(!CU.isEmpty(rs.def.productId)) {
				reloadProjectDropList(rs.def.productId, function() {
					$("#projectId").val(rs.def.projectId);
					var item = CU.getDropItemRecord("DV_PROJECT_CODE",rs.def.projectId);
					var respType = item.attributes.respCodeType;
					var url = item.attributes.respCodeUrl;
					$("#respUrl").val(url);
					$("#respType1").prop("checked", respType ==1);
					$("#respType2").prop("checked", respType ==2);
					setDisabled(false);
				});
			}
		}
		$("#respUser").val(rs.def.respUser);
		$("#respPwd").val(rs.def.respPwd);
		reloadDefDropList(isExternal,rs.def.projectId,function(){
			$("#imageDefId").val(rs.def.imageDefId);
		});
		$("#dockerFilePath").val(rs.def.dockerFilePath);
		
		$("#respBranch").val(rs.def.respBranch);
		$("#depTag").val(rs.def.depTag);
		var openEmail = rs.def.openEmail;
		if(openEmail){
			$("#openEmail").prop("checked",true);
		}
		var openCache = rs.def.openCache;
		if(openCache){
			$("#openCache").prop("checked",true);
		}
	}});
}

/**提交表单**/
function submitForm(){
	var bean = PU.getFormData("form_buildDef");
	
	bean.buildName=$("#buildNameText").text()+$("#buildName").val();
	bean.respType = $("#respType1").prop("checked") ? 1 : 2;
	if(bean.isExternal){
		delete bean.productId;
		delete bean.projectId;
	}else {
		var productId = $("#productId").val();
		var projectId = $("#projectId").val();
		if(CU.isEmpty(productId)){CC.showMsg({msg:"所属产品不能为空"}); return;}
		if(CU.isEmpty(projectId)){CC.showMsg({msg:"所属工程不能为空"}); return;}
	}
		if(CU.isEmpty(bean.imageDefId)){CC.showMsg({msg:"镜像定义不能为空"}); return;}
		if(CU.isEmpty(bean.dockerFilePath)){CC.showMsg({msg:"DockerFilePath不能为空"}); return;}

	
	if(!CU.isEmpty(CurrentId)) bean.id = CurrentId;
	
	RS.ajax({url:"/dev/build/saveOrUpdateDef",ps:bean,cb:function(rs) {
		CurrentId = rs;
		var url = ContextPath+"/dispatch/mc/10305";
		if(!CU.isEmpty(CurrentPageNum)) url += "?pageNum="+CurrentPageNum;
		window.location = url;
	}});
}
/**
 *校验构建名是否重复
 */
function checkBuildFullName(){
	var buildName=$("#buildNameText").text()+$("#buildName").val();
	var id="";
	if(!CU.isEmpty(CurrentId)){
		id= CurrentId;
	} 
	if(CU.isEmpty($("#buildName").val())){
		$(".error_tit").hide();
		$(".success_tit").hide();
		return;
	}
	RS.ajax({url:"/dev/build/checkBuildFullName",ps:{id:id,buildName:buildName},cb:function(rs) {
		var id=rs;
		if(id==0){
			$(".error_tit").show();
			$(".success_tit").hide();
			$("#buildName").val("");
		}else{
			$(".success_tit").show();
			$(".error_tit").hide();
		}
	}});
}
function checkDepTag(){
	var code = $("#depTag").val();
	var tag_reg = /^\d{1}\.\d{1}\.\d{1}$/;
	if(code==null || code==""){
		$(".tag_success").hide();
		$(".tag_tit").hide();
		return;
	}
	if(tag_reg.test(code)){
		$(".tag_success").show();
		$(".tag_tit").hide();
	}else{
		$(".tag_tit").show();
		$(".tag_success").hide();
		$("#depTag").val("");
	}
}

